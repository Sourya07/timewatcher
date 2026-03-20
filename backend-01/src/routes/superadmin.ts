import express from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { verifySuperAdminToken } from '../middleware/superadminmiddleware';

const prisma = new PrismaClient();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// ─── Sign In ──────────────────────────────────────────────────────────────────
const signinSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

router.post('/signin', async (req, res) => {
    try {
        const result = signinSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: result.error.flatten().fieldErrors });
        }

        const { email, password } = result.data;

        const superAdmin = await prisma.superAdmin.findUnique({ where: { email } });
        if (!superAdmin) return res.status(400).json({ error: 'Invalid credentials' });

        const isValid = await bcrypt.compare(password, superAdmin.password);
        if (!isValid) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ superAdminId: String(superAdmin.id) }, JWT_SECRET);

        return res.json({
            token,
            superAdmin: { id: superAdmin.id, name: superAdmin.name, email: superAdmin.email }
        });
    } catch (error) {
        console.error('SuperAdmin signin error:', error);
        return res.status(500).json({ error: 'Server error during signin' });
    }
});

// ─── Get Current SuperAdmin ───────────────────────────────────────────────────
router.get('/me', verifySuperAdminToken, async (req, res) => {
    try {
        const id = Number(req.superAdmin?.id);
        const superAdmin = await prisma.superAdmin.findUnique({ where: { id } });
        if (!superAdmin) return res.status(404).json({ error: 'SuperAdmin not found' });
        return res.json({ id: superAdmin.id, name: superAdmin.name, email: superAdmin.email });
    } catch {
        return res.status(500).json({ error: 'Server error' });
    }
});

// ─── List Pending Shops ───────────────────────────────────────────────────────
router.get('/shops/pending', verifySuperAdminToken, async (req, res) => {
    try {
        const shops = await prisma.adminShop.findMany({
            where: { verificationStatus: 'pending' },
            include: {
                Admin: { select: { id: true, name: true, email: true } },
                category: true,
                services: true,
                // @ts-ignore
                images: true
            },
            orderBy: { id: 'desc' },
        });
        return res.status(200).json({ shops, count: shops.length });
    } catch (error) {
        console.error('Error fetching pending shops:', error);
        return res.status(500).json({ error: 'Failed to fetch pending shops' });
    }
});

// ─── List All Shops (with status) ─────────────────────────────────────────────
router.get('/shops/all', verifySuperAdminToken, async (req, res) => {
    try {
        const { status } = req.query;

        const whereClause: any = {};
        if (status && typeof status === 'string') {
            whereClause.verificationStatus = status;
        }

        const shops = await prisma.adminShop.findMany({
            where: whereClause,
            include: {
                Admin: { select: { id: true, name: true, email: true } },
                category: true,
                services: true,
                // @ts-ignore
                images: true
            },
            orderBy: { id: 'desc' },
        });
        return res.status(200).json({ shops, count: shops.length });
    } catch (error) {
        console.error('Error fetching shops:', error);
        return res.status(500).json({ error: 'Failed to fetch shops' });
    }
});

// ─── Approve a Shop ──────────────────────────────────────────────────────────
router.patch('/shops/:id/approve', verifySuperAdminToken, async (req, res) => {
    try {
        const shopId = Number(req.params.id);

        const shop = await prisma.adminShop.findUnique({ where: { id: shopId } });
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const updatedShop = await prisma.adminShop.update({
            where: { id: shopId },
            data: {
                verificationStatus: 'approved',
                rejectionReason: null,
            },
            include: {
                Admin: { select: { id: true, name: true, email: true } },
                category: true,
                services: true,
                // @ts-ignore
                images: true
            },
        });

        console.log(`✅ Shop #${shopId} approved by SuperAdmin`);
        return res.status(200).json({ message: 'Shop approved successfully', shop: updatedShop });
    } catch (error) {
        console.error('Error approving shop:', error);
        return res.status(500).json({ error: 'Failed to approve shop' });
    }
});

// ─── Reject a Shop ───────────────────────────────────────────────────────────
router.patch('/shops/:id/reject', verifySuperAdminToken, async (req, res) => {
    try {
        const shopId = Number(req.params.id);
        const { reason } = req.body;

        const shop = await prisma.adminShop.findUnique({ where: { id: shopId } });
        if (!shop) return res.status(404).json({ error: 'Shop not found' });

        const updatedShop = await prisma.adminShop.update({
            where: { id: shopId },
            data: {
                verificationStatus: 'rejected',
                rejectionReason: reason || 'Your shop listing did not meet our guidelines.',
            },
            include: {
                Admin: { select: { id: true, name: true, email: true } },
                category: true,
                services: true,
                // @ts-ignore
                images: true
            },
        });

        console.log(`❌ Shop #${shopId} rejected by SuperAdmin. Reason: ${reason || 'N/A'}`);
        return res.status(200).json({ message: 'Shop rejected', shop: updatedShop });
    } catch (error) {
        console.error('Error rejecting shop:', error);
        return res.status(500).json({ error: 'Failed to reject shop' });
    }
});

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
router.get('/stats', verifySuperAdminToken, async (req, res) => {
    try {
        const [totalShops, pendingShops, approvedShops, rejectedShops, totalUsers, totalBookings] = await Promise.all([
            prisma.adminShop.count(),
            prisma.adminShop.count({ where: { verificationStatus: 'pending' } }),
            prisma.adminShop.count({ where: { verificationStatus: 'approved' } }),
            prisma.adminShop.count({ where: { verificationStatus: 'rejected' } }),
            prisma.user.count(),
            prisma.booking.count(),
        ]);

        return res.status(200).json({
            totalShops,
            pendingShops,
            approvedShops,
            rejectedShops,
            totalUsers,
            totalBookings,
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ─── Seed SuperAdmin (one-time setup) ─────────────────────────────────────────
router.post('/seed', async (req, res) => {
    try {
        const existing = await prisma.superAdmin.findFirst();
        if (existing) {
            return res.status(400).json({ error: 'SuperAdmin already exists' });
        }

        const hashedPassword = await bcrypt.hash('SuperAdmin@123', 10);

        const superAdmin = await prisma.superAdmin.create({
            data: {
                name: 'Super Admin',
                email: 'admin@timewatcher.com',
                password: hashedPassword,
            },
        });

        return res.status(201).json({
            message: 'SuperAdmin created successfully',
            email: superAdmin.email,
            defaultPassword: 'SuperAdmin@123 (change this immediately!)',
        });
    } catch (error) {
        console.error('Error seeding SuperAdmin:', error);
        return res.status(500).json({ error: 'Failed to seed SuperAdmin' });
    }
});

export default router;
