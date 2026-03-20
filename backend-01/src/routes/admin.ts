import express from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { verifyAdminToken } from '../middleware/authmiddleware';
import sgMail from "@sendgrid/mail";
import crypto from "crypto";
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';

const prisma = new PrismaClient();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

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
            isVerified: false
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
    
    // Email verification temporarily disabled (SendGrid not configured locally)
    // const verificationLink = `https://timewatcher.onrender.com/api/v1/admin/verify-email?token=${verificationToken}`;
    // console.log(verificationLink)

    // await sgMail.send({
    //     to: email, // recipient
    //     from: "souryavardhan.23b1531158@abes.ac.in", // must be verified in SendGrid
    //     subject: "Verify your email",
    //     html: `
    //             <h2>Welcome, ${name}!</h2>
    //             <p>Click below to verify your email:</p>
    //             <a href="${verificationLink}">Verify Email</a>
    //         `,
    // });

    return res.status(201).json({
        message: 'User created. Please check your email to verify your account.',
        userId: newUser.id
    });



});



// ─── Validate current session ─────────────────────────────────────────────────
router.get('/me', verifyAdminToken, async (req, res) => {
    try {
        const adminId = Number(req.user?.id);
        const admin = await prisma.admin.findUnique({ where: { id: adminId } });
        if (!admin) return res.status(404).json({ error: 'Admin not found' });
        return res.json({ id: admin.id, name: admin.name, email: admin.email });
    } catch {
        return res.status(500).json({ error: 'Server error' });
    }
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
    try {
        const result = signinSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: result.error.flatten().fieldErrors });
        }

        const { email, password } = result.data;

        const user = await prisma.admin.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        if (!user.password) {
             return res.status(400).json({ error: 'Please use Social Login for this account' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET);

        return res.json({ token });
    } catch (error) {
        console.error('Admin signin error:', error);
        return res.status(500).json({ error: 'Server error during signin' });
    }
});

// Google Authentication
router.post('/google', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: [
                GOOGLE_CLIENT_ID,
                process.env.GOOGLE_IOS_CLIENT_ID || '', 
                process.env.GOOGLE_ANDROID_CLIENT_ID || ''
            ].filter(Boolean),
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) return res.status(400).json({ error: 'Invalid Google Token' });

        const email = payload.email;
        const name = payload.name || 'Admin';
        const googleId = payload.sub;

        let admin = await prisma.admin.findUnique({ where: { email } });

        if (!admin) {
            admin = await prisma.admin.create({
                data: {
                    email,
                    name,
                    googleId,
                    isVerified: true, 
                }
            });
        } else if (!admin.googleId) {
            admin = await prisma.admin.update({
                where: { email },
                data: { googleId, isVerified: true }
            });
        }

        const token = jwt.sign({ userId: admin.id }, JWT_SECRET);
        return res.json({ token });
    } catch (error) {
        console.error('Google Auth error:', error);
        return res.status(500).json({ error: 'Failed to authenticate with Google' });
    }
});

// Apple Authentication
router.post('/apple', async (req, res) => {
    try {
        const { idToken, name } = req.body;
        if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

        const decoded = jwt.decode(idToken) as jwt.JwtPayload;
        const audience = process.env.APPLE_CLIENT_ID || (decoded && decoded.aud) || 'your.bundle.identifier';

        const appleIdTokenClaims = await appleSignin.verifyIdToken(idToken, {
            audience,
            ignoreExpiration: true, 
        });

        const email = appleIdTokenClaims.email;
        const appleId = appleIdTokenClaims.sub;
        if (!email || !appleId) return res.status(400).json({ error: 'Invalid Apple Token' });

        let admin = await prisma.admin.findUnique({ where: { email } });

        if (!admin) {
            admin = await prisma.admin.create({
                data: {
                    email,
                    name: name || 'Admin', 
                    appleId,
                    isVerified: true,
                }
            });
        } else if (!admin.appleId) {
            admin = await prisma.admin.update({
                where: { email },
                data: { appleId, isVerified: true }
            });
        }

        const token = jwt.sign({ userId: admin.id }, JWT_SECRET);
        return res.json({ token });
    } catch (error) {
        console.error('Apple Auth error:', error);
        return res.status(500).json({ error: 'Failed to authenticate with Apple' });
    }
});

router.post('/adminshop', verifyAdminToken, async (req, res) => {
    const adminId = Number(req.user?.id);

    // 🐛 Debug: Log token info
    console.log('=== /adminshop called ===')
    console.log('req.user:', req.user);
    console.log('adminId extracted:', adminId);
    console.log('Authorization header:', req.headers.authorization?.substring(0, 40) + '...');

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
        isOpen,
        categoryName,
        images, // Array of strings for gallery
        services
    } = req.body;

    try {
        const adminExists = await prisma.admin.findUnique({
            where: { id: adminId }
        });

        if (!adminExists) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        // Find or create Category
        let categoryId = null;
        if (categoryName) {
            let cat = await prisma.category.findUnique({ where: { name: categoryName } });
            if (!cat) {
                cat = await prisma.category.create({ data: { name: categoryName } });
            }
            categoryId = cat.id;
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
                isOpen: isOpen ?? true,
                verificationStatus: 'pending', // Requires SuperAdmin approval
                Admin: { connect: { id: adminId } },
                ...(categoryId && { category: { connect: { id: categoryId } } }),
                // Create nested services
                ...(services && services.length > 0 && {
                    services: {
                        create: services.map((s: any) => ({
                            name: s.name,
                            price: Number(s.price),
                            durationMins: s.durationMins ? Number(s.durationMins) : null,
                            description: s.description || null
                        }))
                    }
                }),
                // Create nested gallery images
                ...(images && Array.isArray(images) && images.length > 0 && {
                    images: {
                        create: images.map((url: string) => ({ url }))
                    }
                })
            },
            include: {
                services: true,
                category: true,
                images: true
            }
        });

        return res.status(201).json({
            shop: newShop,
            message: 'Shop created successfully! It will be visible to users after verification by our team.'
        });
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
            include: {
                services: true,
                category: true,
                images: true
            }
        });

        return res.status(200).json({ shops });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch shops' });
    }
});

// Update Shop Scheduling Settings
router.patch('/adminshop/:id/settings', verifyAdminToken, async (req, res) => {
    try {
        const shopId = Number(req.params.id);
        const adminId = Number(req.user?.id);
        const { isOpen, slotDuration, price } = req.body;

        const shop = await prisma.adminShop.findUnique({ where: { id: shopId } });
        
        if (!shop) {
            return res.status(404).json({ error: "Shop not found" });
        }
        
        if (shop.AdminId !== adminId) {
            return res.status(403).json({ error: "Unauthorized. You do not own this shop." });
        }

        const dataToUpdate: any = {};
        if (isOpen !== undefined) dataToUpdate.isOpen = Boolean(isOpen);

        const updatedShop = await prisma.adminShop.update({
            where: { id: shopId },
            data: dataToUpdate,
            include: { services: true }
        });

        return res.status(200).json({ message: "Settings updated", shop: updatedShop });

    } catch (error) {
        console.error("Error updating shop settings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Get bookings for a specific admin shop
router.get('/adminshop/:id/bookings', verifyAdminToken, async (req, res) => {
    try {
        const shopId = Number(req.params.id);
        const adminId = Number(req.user?.id);

        // Verify the shop belongs to this admin
        const shop = await prisma.adminShop.findUnique({ where: { id: shopId } });
        if (!shop) return res.status(404).json({ error: "Shop not found" });
        if (shop.AdminId !== adminId) return res.status(403).json({ error: "Unauthorized" });

        // Get all bookings across all services for this shop
        const bookings = await prisma.booking.findMany({
            where: {
                service: { shopId: shopId },
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                service: { select: { name: true } }
            },
            orderBy: { startTime: 'asc' } // chronological order for the calendar
        });

        res.status(200).json(bookings);
    } catch (error) {
        console.error("Error fetching shop bookings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;