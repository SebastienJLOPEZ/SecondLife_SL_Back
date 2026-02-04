require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const authRoutes = require('./routes/auth');
const weeklyThemeRoutes = require('./models/WeeklyTheme');
const { generateWeeklyTheme } = require('./bot/weeklytheme');
const articleRoutes = require('./routes/article');
const { verifyToken, verifyAdmin } = require('./middleware/auth');
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
app.use('/api/weeklytheme', weeklyThemeRoutes);
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
app.use('/api/thread', threadRoutes);
app.use('/api/offer', offerRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${process.env.PUBLIC_BACKEND_PATH}`);
});

cron.schedule('* * * * *', async () => {
    try {
        const response = await fetch(`${process.env.PUBLIC_BACKEND_PATH}/api/weeklytheme/month`);
        const data = await response.json();

        console.log('Données des thèmes mensuels récupérées :', data);

        if (!data.success || !data.data || data.data.length === 0) {
            console.log('Aucun thème disponible pour le mois actuel');
            return;
        }

        const selectedThemes = await generateWeeklyTheme(data.data);

        console.log('Thèmes hebdomadaires mis à jour avec succès :', selectedThemes);

        await fetch(`${process.env.PUBLIC_BACKEND_PATH}/api/weeklytheme/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newThemes: selectedThemes })
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour des thèmes hebdomadaires :', error);
    }
});