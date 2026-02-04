require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const threadRoutes = require('./routes/thread');
const offerRoutes = require('./routes/offer');

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());

// Configuration EJS
app.set('view engine', 'ejs');
app.set('views', './pages');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/thread', threadRoutes);
app.use('/api/offer', offerRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${process.env.PUBLIC_BACKEND_PATH}`);
});