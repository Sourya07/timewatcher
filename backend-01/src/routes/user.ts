import express from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/usermiddleware';
import sgMail from "@sendgrid/mail";
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';

const prisma = new PrismaClient();

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret'; // 🔐 Use env in prod
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
console.log(process.env.SENDGRID_API_KEY)

// const transporter = nodemailer.createTransport({
//     host: 'smtp.ethereal.email',
//     port: 587,
//     auth: {
//         user: 'baron88@ethereal.email',
//         pass: 'EWyjAsGQCRzgg7mw26'
//     }
// });


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

        // Email verification disabled until SendGrid is configured in prod
        // const verificationLink = `https://timewatcher.onrender.com/api/v1/user/verify-email?token=${verificationToken}`;
        // await sgMail.send({ to: email, from: '...', subject: 'Verify ...', html: `...` });

        return res.status(201).json({
            message: 'Account created successfully! You can now sign in.',
        });

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
    try {
        const result = signinSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ error: result.error.flatten().fieldErrors });
        }

        const { email, password } = result.data;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(400).json({ error: 'Invalid credentials' });

        if (!user.password) {
             return res.status(400).json({ error: 'Please use Social Login for this account' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ userId: user.id }, JWT_SECRET);

        return res.json({ token });
    } catch (error) {
        console.error('Signin error:', error);
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
                // Add your iOS/Android Client IDs here if they differ
                process.env.GOOGLE_IOS_CLIENT_ID || '', 
                process.env.GOOGLE_ANDROID_CLIENT_ID || ''
            ].filter(Boolean),
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) return res.status(400).json({ error: 'Invalid Google Token' });

        const email = payload.email;
        const name = payload.name || 'User';
        const googleId = payload.sub;

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    googleId,
                    isVerified: true, // Google emails are already verified
                }
            });
        } else if (!user.googleId) {
            // Link existing account with Google
            user = await prisma.user.update({
                where: { email },
                data: { googleId, isVerified: true }
            });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET);
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

        // Verify Apple token
        const appleIdTokenClaims = await appleSignin.verifyIdToken(idToken, {
            audience,
            ignoreExpiration: true, // Accept slightly expired tokens during auth flow delays
        });

        const email = appleIdTokenClaims.email;
        const appleId = appleIdTokenClaims.sub;
        if (!email || !appleId) return res.status(400).json({ error: 'Invalid Apple Token' });

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    name: name || 'User', // Apple only sends name on first login, frontend must capture it
                    appleId,
                    isVerified: true,
                }
            });
        } else if (!user.appleId) {
            user = await prisma.user.update({
                where: { email },
                data: { appleId, isVerified: true }
            });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET);
        return res.json({ token });
    } catch (error) {
        console.error('Apple Auth error:', error);
        return res.status(500).json({ error: 'Failed to authenticate with Apple' });
    }
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
        const shops = await prisma.adminShop.findMany({
            include: {
                services: true,
                category: true
            }
        }); // no filter -> all shops
        return res.status(200).json({ shops });
    } catch (error) {
        console.error('Error fetching shops:', error);
        return res.status(500).json({ error: 'Failed to fetch shops' });
    }
});


router.post('/userdetails', verifyToken, async (req, res) => {
    try {
        const { image, latitude, longitude, address, mobilenumber } = req.body;
        const UserId = Number(req.user?.id);

        const userprofile = await prisma.userprofile.upsert({
            where: {
                UserID: UserId
            },
            update: {
                image,
                latitude,
                longitude,
                address,
                mobilenumber
            },
            create: {
                image,
                latitude,
                longitude,
                address,
                mobilenumber,
                UserID: UserId
            }
        });

        res.status(201).json({
            success: true,
            data: userprofile
        });
    } catch (error) {
        console.error("Error creating user profile:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
});

// ----------------------------------------------------------------------
// ADDRESS BOOK APIS
// ----------------------------------------------------------------------

// 1. Get all saved addresses for a user
router.get('/addresses', verifyToken, async (req, res) => {
    try {
        const userId = Number(req.user?.id);
        const addresses = await prisma.userAddress.findMany({
            where: { userId },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
        });
        res.status(200).json(addresses);
    } catch (error: any) {
        console.error("Error fetching addresses:", error);
        res.status(500).json({ error: "Failed to fetch addresses" });
    }
});

// 2. Add a new address to the address book
router.post('/addresses', verifyToken, async (req, res) => {
    try {
        const userId = Number(req.user?.id);
        // Expect tag (e.g., Home, Work, Other), full address, lat, lng, and optional isDefault flag.
        const { tag, address, latitude, longitude, isDefault, flatNo, pincode, mobileNo } = req.body;

        if (!tag || !address || latitude === undefined || longitude === undefined) {
             return res.status(400).json({ error: "Missing required address fields" });
        }

        // If this is marked default, or if it's the user's first address, unset old defaults and update primary profile
        const existingCount = await prisma.userAddress.count({ where: { userId } });
        const shouldBeDefault = isDefault || existingCount === 0;

        if (shouldBeDefault) {
            await prisma.userAddress.updateMany({
                where: { userId },
                data: { isDefault: false }
            });
            
            // Sync with primary legacy profile
            await prisma.userprofile.upsert({
                where: { UserID: userId },
                update: { address, latitude, longitude, mobilenumber: mobileNo || '' },
                create: { address, latitude, longitude, UserID: userId, mobilenumber: mobileNo || '' }
            });
        }

        const newAddress = await prisma.userAddress.create({
            data: {
                userId,
                tag,
                flatNo,
                address,
                pincode,
                mobileNo,
                latitude,
                longitude,
                isDefault: shouldBeDefault
            }
        });

        res.status(201).json(newAddress);
    } catch (error: any) {
        console.error("Error adding address:", error);
        res.status(500).json({ error: "Failed to add address" });
    }
});

// 3. Mark a specific address as the default Active Location
router.put('/addresses/:id/default', verifyToken, async (req, res) => {
    try {
        const userId = Number(req.user?.id);
        const addressId = Number(req.params.id);

        const targetAddress = await prisma.userAddress.findUnique({
            where: { id: addressId }
        });

        if (!targetAddress || targetAddress.userId !== userId) {
            return res.status(404).json({ error: "Address not found" });
        }

        // Unset all existing defaults
        await prisma.userAddress.updateMany({
            where: { userId },
            data: { isDefault: false }
        });

        // Set this one as default
        const updatedAddress = await prisma.userAddress.update({
            where: { id: addressId },
            data: { isDefault: true }
        });

        // Sync with primary legacy profile for backward compatibility in the app
        await prisma.userprofile.upsert({
            where: { UserID: userId },
            update: { 
                address: targetAddress.address, 
                latitude: targetAddress.latitude, 
                longitude: targetAddress.longitude 
            },
            create: { 
                address: targetAddress.address, 
                latitude: targetAddress.latitude, 
                longitude: targetAddress.longitude, 
                UserID: userId, 
                mobilenumber: '' 
            }
        });

        res.status(200).json(updatedAddress);
    } catch (error: any) {
        console.error("Error setting default address:", error);
        res.status(500).json({ error: "Failed to set default address" });
    }
});

export default router;