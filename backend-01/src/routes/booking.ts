import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/usermiddleware';
import { sendPushNotification } from './notifications';

const router = express.Router();
const prisma = new PrismaClient();

// Convert "hh:mm AM/PM" or "5 AM" → minutes from midnight
function time12hToMinutes(time?: string) {
    if (!time) return 0;
    const normalized = time.trim().toUpperCase();
    const match = normalized.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)?$/);
    
    if (!match) return 0;
    
    let hours = parseInt(match[1]);
    let minutes = match[2] ? parseInt(match[2]) : 0;
    const modifier = match[3];

    if (modifier === "PM" && hours !== 12) {
        hours += 12;
    }
    if (modifier === "AM" && hours === 12) {
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

// GET dynamically generated slots for a shop on a specific date
router.get('/slots/:shopId', async (req, res) => {
    try {
        const shopId = Number(req.params.shopId);
        const { date } = req.query; // YYYY-MM-DD format expected

        if (!date || typeof date !== 'string') {
            return res.status(400).json({ message: "date parameter (YYYY-MM-DD) is required" });
        }

        const shop = await prisma.adminShop.findUnique({
            where: { id: shopId },
            select: { timein: true, timeout: true, isOpen: true },
        });

        const serviceId = Number(req.query.serviceId);
        
        let SLOT_DURATION_MINS = 30; // default fallback if no service selected yet
        if (serviceId) {
            const service = await prisma.shopService.findUnique({ where: { id: serviceId } });
            if (service && service.durationMins) {
                SLOT_DURATION_MINS = service.durationMins;
            }
        }

        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }

        if (!shop.isOpen) {
            return res.status(200).json({ date, slots: [] });
        }

        const shopOpen = time12hToMinutes(shop.timein);
        const shopClose = time12hToMinutes(shop.timeout);

        // Fetch all non-cancelled bookings for ANY service inside this shop on this date
        // Since booking now references shopServiceId, we query through the service relation.
        const targetDate = new Date(date);
        targetDate.setUTCHours(0, 0, 0, 0);

        const nextDay = new Date(targetDate);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);

        const bookingsOnDate = await prisma.booking.findMany({
            where: {
                service: { shopId: shopId },
                status: { not: "cancelled" },
                startTime: {
                    gte: targetDate,
                    lt: nextDay
                }
            },
            select: { startTime: true, endTime: true }
        });

        // Generate exact-minute slots governed by the requested service's duration
        const slots = [];

        for (let currentTime = shopOpen; currentTime + SLOT_DURATION_MINS <= shopClose; currentTime += SLOT_DURATION_MINS) {
            const slotStart = new Date(targetDate);
            slotStart.setUTCMinutes(slotStart.getUTCMinutes() + currentTime);

            const slotEnd = new Date(slotStart);
            slotEnd.setUTCMinutes(slotEnd.getUTCMinutes() + SLOT_DURATION_MINS);

            const now = new Date();

            // Check if slot overlaps with any existing booking or is in the past
            const isPast = slotStart < now;
            const isBooked = isPast || bookingsOnDate.some(b => {
                // A slot overlaps if (existingStart < slotEnd) AND (existingEnd > slotStart)
                return b.startTime.getTime() < slotEnd.getTime() && b.endTime.getTime() > slotStart.getTime();
            });

            slots.push({
                time: minutesTo12h(currentTime),
                startTime: slotStart.toISOString(),
                endTime: slotEnd.toISOString(),
                isBooked
            });
        }

        res.status(200).json({ date, slots });
    } catch (error: any) {
        console.error("Error fetching slots:", error);
        res.status(500).json({ message: "Failed to fetch slots", error: error.message });
    }
});

router.post('/', verifyToken, async (req, res) => {
    try {
        const { shopServiceId, duration, price, bookingStart, bookingEnd } = req.body;
        const userId = Number(req.user?.id);

        if (!shopServiceId) {
            return res.status(400).json({ message: "shopServiceId is required" });
        }

        if (!bookingStart || !bookingEnd) {
            return res.status(400).json({ message: "bookingStart and bookingEnd are required" });
        }

        const startDt = new Date(bookingStart);
        const endDt = new Date(bookingEnd);
        const now = new Date();

        if (startDt < now) {
            return res.status(400).json({ message: "Cannot book a time slot in the past." });
        }

        if (endDt <= startDt) {
            return res.status(400).json({ message: "End time must be after start time" });
        }

        // 1️⃣ Get service details (which includes shop details)
        const service = await prisma.shopService.findUnique({
            where: { id: shopServiceId },
            include: { shop: { include: { Admin: { select: { email: true, name: true } } } } }
        });

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }
        
        const shopId = service.shop.id;

        // 2️⃣ Check for overlapping bookings across ALL services for this shop
        // A booking overlaps if (existingStart < newEnd) AND (existingEnd > newStart)
        // Also it must be "booked: true" or "status != cancelled"
        const conflictingBooking = await prisma.booking.findFirst({
            where: {
                service: { shopId: shopId },
                status: { not: "cancelled" }, // any active/upcoming booking
                AND: [
                    { startTime: { lt: endDt } },
                    { endTime: { gt: startDt } }
                ]
            }
        });

        if (conflictingBooking) {
            return res.status(400).json({
                message: "This exact time slot is already booked. Please refresh the page and select an available slot.",
                code: "SLOT_UNAVAILABLE"
            });
        }

        // 3️⃣ Create booking
        const booking: any = await prisma.booking.create({
            data: {
                shopServiceId,
                duration,
                price,
                booked: true, // Keep for legacy until frontend transitions fully
                status: "upcoming",
                startTime: startDt,
                endTime: endDt,
                userId
            },
            include: {
                service: {
                    include: {
                        shop: {
                            select: {
                                occupation: true,
                                Admin: { select: { name: true, email: true, pushToken: true } }
                            }
                        }
                    }
                },
                user: {
                    select: { name: true, email: true }
                }
            }
        });

        // 4️⃣ Optional: Notify admin
        const adminEmail = booking.service.shop.Admin.email;
        const pushToken = booking.service.shop.Admin.pushToken;
        console.log(`📢 Notify admin ${adminEmail}: ${booking.user.name} booked from ${bookingStart} to ${bookingEnd}`);
        
        if (pushToken) {
            // Background notification
            sendPushNotification(
                pushToken,
                "New Booking Received! 🎉",
                `${booking.user.name} just booked a ${booking.duration}m session.`,
                { bookingId: booking.id }
            );
        }

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
                service: {
                    include: {
                        shop: {
                            select: {
                                id: true,
                                occupation: true,
                                speclization: true,
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
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Auto-transition upcoming bookings that are in the past to 'completed'
        const now = new Date();
        let needsUpdate = false;
        
        const currentBookings = bookings.map(booking => {
            if (booking.status === 'upcoming' && new Date(booking.endTime) < now) {
                needsUpdate = true;
                return { ...booking, status: 'completed' };
            }
            return booking;
        });

        if (needsUpdate) {
            // Update db async, no need to block the response
            prisma.booking.updateMany({
                where: {
                    userId,
                    status: 'upcoming',
                    endTime: { lt: now }
                },
                data: { status: 'completed' }
            }).catch(console.error);
        }

        res.status(200).json(currentBookings);
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

        const booking = (await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                user: { select: { name: true } },
                service: {
                    include: { shop: { select: { Admin: { select: { 
                        // @ts-ignore
                        pushToken: true 
                    } } } } }
                }
            }
        })) as any;

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.userId !== userId) {
            return res.status(403).json({ message: "Unauthorized to cancel this booking" });
        }

        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: { 
                booked: false,
                status: 'cancelled' 
            }
        });

        const adminPushToken = booking.service.shop.Admin.pushToken;
        if (adminPushToken) {
            // Background notification
            sendPushNotification(
                adminPushToken,
                "Booking Cancelled ❌",
                `${booking.user.name} has cancelled their booking.`,
                { bookingId }
            );
        }

        res.status(200).json({ message: "Booking cancelled successfully", booking: updatedBooking });
    } catch (error: any) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({ message: "Failed to cancel booking", error: error.message });
    }
});

// PATCH (Reschedule) a booking
router.patch('/:id/reschedule', verifyToken, async (req, res) => {
    try {
        const bookingId = Number(req.params.id);
        const userId = Number(req.user?.id);
        const { bookingStart, bookingEnd } = req.body;

        if (!bookingStart || !bookingEnd) {
            return res.status(400).json({ message: "bookingStart and bookingEnd are required" });
        }

        const startDt = new Date(bookingStart);
        const endDt = new Date(bookingEnd);
        const now = new Date();

        if (startDt < now) {
            return res.status(400).json({ message: "Cannot reschedule to a past time slot." });
        }
        if (endDt <= startDt) {
            return res.status(400).json({ message: "End time must be after start time." });
        }

        const booking = (await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { 
                service: {
                    include: { shop: { select: { Admin: { select: { 
                        // @ts-ignore
                        pushToken: true 
                    } } } } }
                },
                user: { select: { name: true } }
            }
        })) as any;

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        if (booking.userId !== userId) {
            return res.status(403).json({ message: "Unauthorized to reschedule this booking" });
        }
        if (booking.status === 'cancelled' || booking.status === 'completed') {
            return res.status(400).json({ message: "Cannot reschedule cancelled or completed bookings" });
        }

        // Check for overlaps (ignoring the current booking itself)
        const conflictingBooking = await prisma.booking.findFirst({
            where: {
                id: { not: bookingId },
                service: { shopId: booking.service.shopId },
                status: { not: "cancelled" },
                AND: [
                    { startTime: { lt: endDt } },
                    { endTime: { gt: startDt } }
                ]
            }
        });

        if (conflictingBooking) {
            return res.status(400).json({
                message: "This exact time slot is already booked. Please select an available slot.",
                code: "SLOT_UNAVAILABLE"
            });
        }

        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                startTime: startDt,
                endTime: endDt
            }
        });

        const adminPushToken = booking.service.shop.Admin.pushToken;
        if (adminPushToken) {
            // Background notification
            sendPushNotification(
                adminPushToken,
                "Booking Rescheduled 📅",
                `${booking.user.name} rescheduled their booking.`,
                { bookingId }
            );
        }

        res.status(200).json({ message: "Booking rescheduled successfully", booking: updatedBooking });
    } catch (error: any) {
        console.error("Error rescheduling booking:", error);
        res.status(500).json({ message: "Failed to reschedule booking", error: error.message });
    }
});

export default router;