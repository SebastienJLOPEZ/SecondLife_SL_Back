const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Route Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // Cas où aucun utilisateur n'est trouvé ou mot de passe incorrect
    if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Générer les tokens JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token, refreshToken, userId: user._id });
});


// Route Register
router.post('/register', async (req, res) => {
    const { name, surname, email, password } = req.body;

    try {
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        // Créer un nouvel utilisateur
        const newUser = new User({ name, surname, email, password });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Erreur lors de la création de l\'utilisateur:', error.message);
        res.status(500).json({ message: 'Erreur interne du serveur' });
    }
});

// Route Refresh Token
router.get('/refresh-token', async (req, res) => {
    // Récupérer le refresh token depuis les en-têtes Authorization
    const refreshToken = req.headers.authorization?.split(' ')[1];

    // Dans le cas où il n'y a pas de refresh token
    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Vérifier si le refreshToken est valide et générer un nouveau token si c'est le cas
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const newToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ token: newToken });
    } catch (error) {
        return res.status(401).json({ message: 'Invalid refresh token' });
    }
});

module.exports = router;