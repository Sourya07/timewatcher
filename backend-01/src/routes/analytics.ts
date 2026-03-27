import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAdminToken } from '../middleware/authmiddleware'; // Admin auth middleware

const router = express.Router();
const prisma = new PrismaClient();

// ─── GET /api/v1/analytics/dashboard ──────────────────────────────────────────
// Returns summary statistics for the logged-in admin's shops
router.get('/dashboard', verifyAdminToken, async (req, res) => {
    try {
        const adminId = Number(req.user?.id);

        if (!adminId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        // 1. Get all shops owned by this admin
        const shops = await prisma.adminShop.findMany({
            where: { AdminId: adminId },
            select: { id: true }
        });
        const shopIds = shops.map(shop => shop.id);

        if (shopIds.length === 0) {
            return res.status(200).json({
                totalBookings: 0,
                totalRevenue: 0,
                totalCustomers: 0,
                averageRating: 0,
                recentBookings: []
            });
        }

        // 2. Fetch all bookings for these shops
        const bookings = await prisma.booking.findMany({
            where: {
                service: { shopId: { in: shopIds } },
                status: { not: 'cancelled' } // Only count active/completed revenue
            },
            include: {
                user: { select: { id: true } }
            }
        });

        // 3. Compute stats
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
        
        // Distinct customers
        const uniqueCustomers = new Set(bookings.map(b => b.userId));
        const totalCustomers = uniqueCustomers.size;

        // 4. Calculate Average Rating (across all shops)
        const reviews = await prisma.review.findMany({
            where: { shopId: { in: shopIds } },
            select: { rating: true }
        });
        const averageRating = reviews.length > 0 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 0;

        // 5. Booking trend (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const recentBookingsRaw = await prisma.booking.groupBy({
            by: ['createdAt'],
            where: {
                service: { shopId: { in: shopIds } },
                createdAt: { gte: sevenDaysAgo }
            },
            _count: { id: true },
            orderBy: { createdAt: 'asc' }
        });

        // Group by day string (YYYY-MM-DD)
        const trendMap: Record<string, number> = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            trendMap[d.toISOString().split('T')[0]] = 0;
        }

        recentBookingsRaw.forEach(b => {
            const dayStr = b.createdAt.toISOString().split('T')[0];
            if (trendMap[dayStr] !== undefined) {
                trendMap[dayStr] += b._count.id;
            }
        });

        const recentBookings = Object.keys(trendMap).map(date => ({
            date,
            count: trendMap[date]
        }));

        res.status(200).json({
            totalBookings,
            totalRevenue,
            totalCustomers,
            averageRating: Number(averageRating.toFixed(1)),
            recentBookings
        });

    } catch (error: any) {
        console.error("Dashboard Analytics Error:", error);
        res.status(500).json({ message: "Failed to fetch analytics dashboard", error: error.message });
    }
});

// ─── GET /api/v1/analytics/services ───────────────────────────────────────────
// Returns a breakdown of bookings per service
router.get('/services', verifyAdminToken, async (req, res) => {
    try {
        const adminId = Number(req.user?.id);

        const shops = await prisma.adminShop.findMany({
            where: { AdminId: adminId },
            select: { id: true }
        });
        const shopIds = shops.map(shop => shop.id);

        if (shopIds.length === 0) return res.status(200).json([]);

        // Get count of bookings grouped by service
        const serviceBookings = await prisma.booking.groupBy({
            by: ['shopServiceId'],
            where: {
                service: { shopId: { in: shopIds } },
                status: { not: 'cancelled' }
            },
            _count: { id: true },
            _sum: { price: true },
            orderBy: {
                _count: { id: 'desc' }
            },
            take: 5 // Top 5 services
        });

        // Fetch service names
        const serviceIds = serviceBookings.map(sb => sb.shopServiceId);
        const services = await prisma.shopService.findMany({
            where: { id: { in: serviceIds } },
            select: { id: true, name: true }
        });

        const result = serviceBookings.map(sb => {
            const service = services.find(s => s.id === sb.shopServiceId);
            return {
                serviceId: sb.shopServiceId,
                serviceName: service?.name || 'Unknown Service',
                bookingCount: sb._count.id,
                totalRevenue: sb._sum.price || 0
            };
        });

        res.status(200).json(result);

    } catch (error: any) {
        console.error("Service Analytics Error:", error);
        res.status(500).json({ message: "Failed to fetch service analytics", error: error.message });
    }
});

export default router;
