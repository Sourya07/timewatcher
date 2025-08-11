import express from 'express';
import adminroutes from './routes/admin'
import userroutes from './routes/user'
import bookroutes from './routes/booking'
import cors from 'cors';



const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

app.use('/api/v1/admin', adminroutes)
app.use('/api/v1/user', userroutes)
app.use('/api/v1/booking', bookroutes)

app.get('/', (req, res) => {
    res.send('Hello from Express + TypeScript!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});