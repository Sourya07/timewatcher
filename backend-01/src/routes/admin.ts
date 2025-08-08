import express from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { verifyAdminToken } from '../middleware/authmiddleware';



const prisma = new PrismaClient();


const router = express.Router();
const JWT_SECRET = 'your_jwt_secret'; // 🔐 Use env in prod

// Zod Schemas
const signupSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

const signinSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// Sign Up
router.get('/signup', (req, res) => {
    res.send('Sign up route');
})

router.post('/signup', async (req, res) => {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error.flatten().fieldErrors });
    }

    const { email, password, name } = result.data;

    const existingUser = await prisma.admin.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.admin.create({
        data: {
            email,
            password: hashedPassword,
            name,
        },
    });

    return res.status(201).json({ message: 'User created', userId: newUser.id });
});

// Sign In
router.post('/signin', async (req, res) => {
    const result = signinSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error.flatten().fieldErrors });
    }

    const { email, password } = result.data;

    const user = await prisma.admin.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
        { userId: user.id },
        JWT_SECRET, { expiresIn: '6h' }
    );

    return res.json({ token });
});

router.post('/adminshop', verifyAdminToken, async (req, res) => {
    const adminId = Number(req.user?.id);
    console.log(adminId)
    // Destructure expected fields from req.body
    const {
        image,
        latitude,
        longitude,
        address,
        mobilenumber,
        occupation,
        speclization,
        timein,
        timeout,
        price
    } = req.body;

    try {
        const adminExists = await prisma.admin.findUnique({
            where: { id: adminId }
        });

        if (!adminExists) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        const newShop = await prisma.adminShop.create({
            data: {
                image,
                latitude,
                longitude,
                address,
                mobilenumber,
                occupation,
                speclization,
                timein,
                timeout,
                price,
                Admin: { connect: { id: adminId } },
            },
        });

        return res.status(201).json({ shop: newShop });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Something went wrong' });
    }
});

router.get('/adminshops', verifyAdminToken, async (req, res) => {
    const adminId = Number(req.user?.id);

    try {
        const shops = await prisma.adminShop.findMany({
            where: {
                AdminId: adminId,
            },
        });

        return res.status(200).json({ shops });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch shops' });
    }
});

export default router;