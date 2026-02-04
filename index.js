require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const articleRoutes = require('./routes/article');
const { verifyToken, verifyAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    // Permettre l'accès aux pages HTML avec le token dans le query string (pour la redirection depuis le login)
    if (req.query.token) {
        req.headers.authorization = `Bearer ${req.query.token}`;
    }
    next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/article', articleRoutes);

app.get('/post-article', verifyToken, verifyAdmin, (req, res) => {
    try {
        res.render('postArticle');
    } catch (error) {
        console.error('Erreur lors du rendu de la page de publication d\'article:', error);
        res.status(500).send('Erreur serveur');
    }
});

app.get('/login', (req, res) => {
    try {
        res.render('auth-login');
    } catch (error) {
        console.error('Erreur lors du rendu de la page de login:', error);
        res.status(500).send('Erreur serveur');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${process.env.PUBLIC_BACKEND_PATH}`);
});