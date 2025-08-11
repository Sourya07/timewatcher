import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/usermiddleware';

const router = express.Router();
const prisma = new PrismaClient();

// Convert "hh:mm AM/PM" → minutes from midnight
function time12hToMinutes(time?: string) {
    if (!time) return 0;
    const [timePart, modifier] = time.trim().split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);

    if (modifier?.toUpperCase() === "PM" && hours !== 12) {
        hours += 12;
    }
    if (modifier?.toUpperCase() === "AM" && hours === 12) {
        hours = 0; // midnight case
    }
    return hours * 60 + minutes;
}

// Convert minutes → "hh:mm AM/PM"
function minutesTo12h(totalMinutes: number) {
    let hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // convert to 12-hour format
    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

router.post('/', verifyToken, async (req, res) => {
    try {
        const { shopId, duration, price, startTime: startStr, endTime: endStr } = req.body;
        const userId = Number(req.user?.id);

        // 1️⃣ Get shop's opening hours
        const shop = await prisma.adminShop.findUnique({
            where: { id: shopId },
            select: { timein: true, timeout: true }
        });

        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }

        // Convert opening/closing times from DB to minutes
        const shopOpen = time12hToMinutes(shop.timein);
        const shopClose = time12hToMinutes(shop.timeout);

        // 2️⃣ Convert booking request times (for checks)
        const startMinutes = time12hToMinutes(startStr);
        const endMinutes = time12hToMinutes(endStr);

        if (endMinutes <= startMinutes) {
            return res.status(400).json({ message: "End time must be after start time" });
        }

        // 3️⃣ Check if within shop's opening hours
        if (startMinutes < shopOpen || endMinutes > shopClose) {
            return res.status(400).json({
                message: `Shop is open from ${minutesTo12h(shopOpen)} to ${minutesTo12h(shopClose)}`
            });
        }

        // 4️⃣ Check for overlapping bookings
        const conflictingBooking = await prisma.booking.findFirst({
            where: {
                shopId,
                booked: true,
                AND: [
                    {
                        // existing start < new end
                        startTime: { lt: endStr }
                    },
                    {
                        // existing end > new start
                        endTime: { gt: startStr }
                    }
                ]
            }
        });

        if (conflictingBooking) {
            return res.status(400).json({
                message: "This time slot is already booked for this shop."
            });
        }

        // 5️⃣ Create booking (store original strings)
        const booking = await prisma.booking.create({
            data: {
                shopId,
                duration,
                price,
                booked: true,
                startTime: startStr,
                endTime: endStr,
                userId
            },
            include: {
                shop: {
                    include: {
                        Admin: {
                            select: {
                                id: true,
                                name: true,
                                email: true // no password
                            }
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        isVerified: true,
                        createdAt: true
                    }
                }
            }
        });

        // Remove sensitive fields


        // 6️⃣ Notify admin (placeholder)
        const adminEmail = booking.shop.Admin.email;
        console.log(`📢 Notify admin ${adminEmail}: ${booking.user.name} booked from ${startStr} to ${endStr}`);

        res.status(201).json({
            message: "Booking created successfully",
            booking
        });

    } catch (error: any) {
        console.error("Error creating booking:", error);
        res.status(500).json({
            message: "Failed to create booking",
            error: error.message
        });
    }
});

export default router;