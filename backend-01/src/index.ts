import express from 'express';
import adminroutes from './routes/admin'
import userroutes from './routes/user'

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


app.use('/api/v1/admin', adminroutes)
app.use('/api/v1/user', userroutes)

app.get('/', (req, res) => {
    res.send('Hello from Express + TypeScript!');
});

app.listen(3000, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});