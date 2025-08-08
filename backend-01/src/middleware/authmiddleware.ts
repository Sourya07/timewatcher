import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your_jwt_secret'; // 🔐 Use process.env.JWT_SECRET in production

interface JwtPayload {
    userId:
    string;
}

// At the top of your middleware file

declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            id: string;
        };
    }
}


export const verifyAdminToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.user = { id: decoded.userId };
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    }
}

