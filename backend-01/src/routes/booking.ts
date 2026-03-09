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

// GET user's bookings
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = Number(req.user?.id);
        
        const bookings = await prisma.booking.findMany({
            where: { userId },
            include: {
                shop: {
                    select: {
                        id: true,
                        occupation: true,
                        speclization: true,
                        price: true,
                        image: true,
                        address: true,
                        latitude: true,
                        longitude: true,
                        Admin: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json(bookings);
    } catch (error: any) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({
            message: "Failed to fetch bookings",
            error: error.message
        });
    }
});

// DELETE (Cancel) a booking
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const bookingId = Number(req.params.id);
        const userId = Number(req.user?.id);

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId }
        });

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.userId !== userId) {
            return res.status(403).json({ message: "Unauthorized to cancel this booking" });
        }

        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: { booked: false }
        });

        res.status(200).json({ message: "Booking cancelled successfully", booking: updatedBooking });
    } catch (error: any) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({ message: "Failed to cancel booking", error: error.message });
    }
});

export default router;