import express from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/usermiddleware';

const prisma = new PrismaClient();


const router = express.Router();
const JWT_SECRET = 'your_jwt_secret'; // 🔐 Use env in prod

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'baron88@ethereal.email',
        pass: 'EWyjAsGQCRzgg7mw26'
    }
});


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

const profileSchema = z.object({
    image: z.string().url().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    address: z.string().optional(),
    mobilenumber: z.string().min(10).max(15),
    UserID: z.number()
});

// Sign Up
router.get('/signup', (req, res) => {
    res.send('Sign up route');
})

router.post('/signup', async (req, res) => {
    try {
        const result = signupSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: result.error.flatten().fieldErrors });
        }

        const { email, password, name } = result.data;

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });

        const verificationToken = jwt.sign(
            { userId: newUser.id },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        const verificationLink = `http://localhost:3000/api/v1/user/verify-email?token=${verificationToken}`;

        // Send verification email
        await transporter.sendMail({
            from: `"MyApp" <baron88@ethereal.email>`,
            to: email,
            subject: 'Verify your email',
            html: `<h2>Welcome, ${name}!</h2>
                   <p>Click below to verify your email:</p>
                   <a href="${verificationLink}">Verify Email</a>`
        });

        return res.status(201).json({ message: 'User created. Please check your email to verify your account.' });

    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ error: 'Server error during signup' });
    }
});



router.get('/verify-email', async (req, res) => {
    const tokenParam = req.query.token;

    console.log("hello")
    // Ensure it's a string
    if (!tokenParam || Array.isArray(tokenParam)) {
        return res.status(400).json({ error: 'Invalid token' });
    }

    const token = tokenParam as string;

    if (!token) return res.status(400).json({ error: 'Token is required' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (typeof decoded === 'string' || !('userId' in decoded)) {
            return res.status(400).json({ error: 'Invalid token payload' });
        }

        console.log(decoded)
        await prisma.user.update({
            where: { id: decoded.userId },
            data: { isVerified: true }
        });
        return res.send('Email verified successfully!');
    } catch (err) {
        return res.status(400).json({ error: 'Invalid or expired token' });
    }
});

// Sign In
router.post('/signin', async (req, res) => {
    const result = signinSchema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: result.error.flatten().fieldErrors });
    }

    const { email, password } = result.data;



    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    if (!user.isVerified) {
        return res.status(403).json({ error: 'Please verify your email before logging in.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET);

    return res.json({ token });
});

router.post("/", verifyToken, async (req, res) => {
    const UserId = Number(req.user?.id);
    const result = profileSchema.safeParse(req.body);
    console.log(req.user?.id)
    if (!result.success) {
        return res
            .status(400)
            .json({ error: result.error.flatten().fieldErrors });
    }

    try {
        if (!UserId) {
            return res.status(401).json({
                error: "Unauthorized"
            });
        }

        const data = result.data;

        // Check if profile exists
        const existingProfile = await prisma.userprofile.findUnique({
            where: { UserID: UserId },
        });

        let profile;
        if (existingProfile) {
            // Update profile
            profile = await prisma.userprofile.update({
                where: { UserID: UserId },
                data,
            });
        } else {
            // Create profile
            profile = await prisma.userprofile.create({
                data: {
                    ...data,
                    UserID: UserId
                },
            });
        }

        res.json({ message: "Profile saved successfully", profile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

// Get Current User Profile
router.get("/", verifyToken, async (req, res) => {

    const UserId = Number(req.user?.id);

    try {

        if (!UserId) {
            return res.status(401).json({ error: "Unauthorized +hlo" });
        }

        const profile = await prisma.user.findUnique({
            where: { id: UserId },
            include: {
                profile: true
            }
        });

        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/adminshops', async (req, res) => {
    try {
        const shops = await prisma.adminShop.findMany(); // no filter -> all shops
        return res.status(200).json({ shops });
    } catch (error) {
        console.error('Error fetching shops:', error);
        return res.status(500).json({ error: 'Failed to fetch shops' });
    }
});

export default router;