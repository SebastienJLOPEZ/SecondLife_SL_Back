const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const router = express.Router();

// Validation rules
const loginValidation = [
    body('email')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
        .trim()
        .escape(),
    body('password')
        .isLength({ min: 1 }).withMessage('Password is required')
        .trim()
];

const registerValidation = [
    body('name')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Name contains invalid characters')
        .trim()
        .escape(),
    body('surname')
        .isLength({ min: 2, max: 50 }).withMessage('Surname must be between 2 and 50 characters')
        .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Surname contains invalid characters')
        .trim()
        .escape(),
    body('email')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
        .trim()
        .escape(),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .withMessage('Password must contain at least one uppercase, one lowercase, one number, and one special character (@$!%*?&)')
        .trim()
];

// Route Login
router.post('/login', loginValidation, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    
    try {
        const user = await User.findOne({ email });

        // Cas où aucun utilisateur n'est trouvé ou mot de passe incorrect
        // Use generic error to prevent user enumeration
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Générer les tokens JWT
        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        res.status(200).json({ accessToken, refreshToken, userId: user._id });
    } catch (error) {
        console.error('Login error:', error.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


// Route Register
router.post('/register', registerValidation, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }

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

    console.log('[Auth Backend] Requête refresh-token reçue:', {
        hasRefreshToken: !!refreshToken,
        refreshTokenLength: refreshToken?.length
    });

    // Dans le cas où il n'y a pas de refresh token
    if (!refreshToken) {
        console.log('[Auth Backend] Pas de refresh token fourni');
        return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Vérifier si le refreshToken est valide et générer un nouveau token si c'est le cas
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        console.log('[Auth Backend] Refresh token valide pour userId:', decoded.userId);
        
        const newToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('[Auth Backend] Nouveau access token généré');
        
        res.status(200).json({ accessToken: newToken });
    } catch (error) {
        console.error('[Auth Backend] Erreur de vérification du refresh token:', error.message);
        return res.status(401).json({ message: 'Invalid refresh token' });
    }
});

module.exports = router;