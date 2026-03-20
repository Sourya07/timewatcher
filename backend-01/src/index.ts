import 'dotenv/config'; // ← MUST be first — loads .env before anything else
import express from 'express';
import adminroutes from './routes/admin'
import userroutes from './routes/user'
import bookroutes from './routes/booking'
import superadminroutes from './routes/superadmin'
import analyticsroutes from './routes/analytics'
import notificationsroutes from './routes/notifications'
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
// Security headers
app.use(helmet());
// HTTP request logging
app.use(morgan('combined'));
// CORS allow all domains for mobile apps and specific origins for web admin
app.use(cors({ origin: '*' }));

// Rate limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
// Apply limiter to all routes
app.use(limiter);

app.use('/api/v1/admin', adminroutes)
app.use('/api/v1/user', userroutes)
app.use('/api/v1/booking', bookroutes)
app.use('/api/v1/superadmin', superadminroutes)
app.use('/api/v1/analytics', analyticsroutes)
app.use('/api/v1/notifications', notificationsroutes)

app.get('/', (req, res) => {
    res.send('Hello from Express + TypeScript!');
});



app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});