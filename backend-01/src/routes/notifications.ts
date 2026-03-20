import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middleware/usermiddleware';
import { verifyAdminToken } from '../middleware/authmiddleware';
import { Expo } from 'expo-server-sdk';

const router = express.Router();
const prisma = new PrismaClient();
const expo = new Expo();

// Register push token for User
router.post('/register-user-token', verifyToken, async (req, res) => {
    try {
        const userId = Number(req.user?.id);
        const { pushToken } = req.body;

        if (!pushToken) {
            return res.status(400).json({ error: "Push token is required" });
        }

        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
            return res.status(400).json({ error: "Invalid push token format" });
        }

        await prisma.user.update({
            where: { id: userId },
            // @ts-ignore - Prisma types might not be updated in TS server yet
            data: { pushToken },
        });

        res.status(200).json({ message: "User push token registered successfully" });
    } catch (error) {
        console.error("Error registering user push token:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Register push token for Admin
router.post('/register-admin-token', verifyAdminToken, async (req, res) => {
    try {
        const adminId = Number(req.user?.id);
        const { pushToken } = req.body;

        if (!pushToken) {
            return res.status(400).json({ error: "Push token is required" });
        }

        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`Push token ${pushToken} is not a valid Expo push token`);
            return res.status(400).json({ error: "Invalid push token format" });
        }

        await prisma.admin.update({
            where: { id: adminId },
            // @ts-ignore - Prisma types might not be updated in TS server yet
            data: { pushToken },
        });

        res.status(200).json({ message: "Admin push token registered successfully" });
    } catch (error) {
        console.error("Error registering admin push token:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

/**
 * Helper function to send push notifications
 */
export const sendPushNotification = async (pushToken: string | null, title: string, body: string, data: Record<string, unknown> = {}) => {
    if (!pushToken || !Expo.isExpoPushToken(pushToken)) {
        console.log(`Cannot send notification. Invalid or missing token: ${pushToken}`);
        return;
    }

    const messages = [{
        to: pushToken,
        sound: 'default' as const,
        title,
        body,
        data,
    }];

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (let chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        } catch (error) {
            console.error("Error sending push notification chunk:", error);
        }
    }
};

export default router;
