import express from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { verifyAdminToken } from '../middleware/authmiddleware';
import sgMail from "@sendgrid/mail";
import crypto from "crypto";

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


sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
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

    function generateVerificationToken(email: string) {
        const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        const data = `${email}|${expiry}`;  // use "|" instead of "."
        const signature = crypto
            .createHmac("sha256", JWT_SECRET)
            .update(data)
            .digest("hex");

        return `${data}|${signature}`; // token = email|expiry|signature
    }
    const verificationToken = encodeURIComponent(generateVerificationToken(email));
    const verificationLink = `https://timewatcher.onrender.com/api/v1/admin/verify-email?token=${verificationToken}`;

    console.log(verificationLink)

    await sgMail.send({
        to: email, // recipient
        from: "souryavardhan.23b1531158@abes.ac.in", // must be verified in SendGrid
        subject: "Verify your email",
        html: `
                <h2>Welcome, ${name}!</h2>
                <p>Click below to verify your email:</p>
                <a href="${verificationLink}">Verify Email</a>
            `,
    });

    return res.status(201).json({
        message: 'User created. Please check your email to verify your account.',
        userId: newUser.id
    });



});



router.get("/verify-email", async (req, res) => {
    console.log("hello")
    const token = decodeURIComponent(req.query.token as string);
    console.log("h1")
    console.log(token)
    if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Invalid token" });
    }

    // 🔹 Inline verification logic
    const parts = token.split("|");
    console.log(parts)
    if (parts.length !== 3) {
        return res.status(400).json({ error: "Invalid token format" });
    }
    console.log("o")

    const [email, expiry, signature] = parts;

    if (Date.now() > parseInt(expiry)) {
        return res.status(400).json({ error: "Token expired" });
    }

    const data = `${email}|${expiry}`;
    const expectedSignature = crypto
        .createHmac("sha256", JWT_SECRET)
        .update(data)
        .digest("hex");



    console.log(expectedSignature)
    console.log(signature)
    if (expectedSignature !== signature) {
        return res.status(400).json({ error: "Invalid token signature" });
    }

    try {
        await prisma.admin.update({
            where: { email },
            data: { isVerified: true },
        });

        return res.send("✅ Email verified successfully!");
    } catch (err) {
        console.error("Verification error:", err);
        return res.status(500).json({ error: "Something went wrong" });
    }
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
    if (!user.isVerified) {
        return res.status(403).json({ error: 'Please verify your email before logging in.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
        { userId: user.id },
        JWT_SECRET
    );

    return res.json({ token });
});

router.post('/adminshop', verifyAdminToken, async (req, res) => {
    const adminId = Number(req.user?.id);


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
        // ✅ Validate before DB insert


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