const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware pour vérifier si l'utilisateur est authentifié
const verifyToken = async (req, res, next) => {
    const accessToken = req.headers.authorization?.split(' ')[1];
    
    if (!accessToken) {        // Si c'est une requête de page HTML, rediriger vers login
        if (req.accepts('html')) {
            return res.redirect('/login');
        } else {
            // Sinon renvoyer un JSON (pour les appels API)        
            return res.status(401).json({ 
            success: false,
            message: 'Token non fourni. Veuillez vous connecter.' 
        });
    }
    }

    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'Utilisateur non trouvé' 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        // Si c'est une requête de page HTML, rediriger vers login
        if (req.accepts('html')) {
            return res.redirect('/login');
        }
        // Sinon renvoyer un JSON (pour les appels API)
        return res.status(401).json({ 
            success: false,
            message: 'Token invalide ou expiré' 
        });
    }
};

// Middleware pour vérifier si l'utilisateur est admin
const verifyAdmin = (req, res, next) => {
    if (!req.user) {
        if (req.accepts('html')) {
            return res.redirect('/login');
        }
        return res.status(401).json({ 
            success: false,
            message: 'Utilisateur non authentifié' 
        });
    }

    if (req.user.role !== 'admin') {
        if (req.accepts('html')) {
            return res.status(403).send('<h1>Accès refusé</h1><p>Vous devez être administrateur pour accéder à cette page.</p><a href="/login">Retour au login</a>');
        }
        return res.status(403).json({ 
            success: false,
            message: 'Accès refusé. Vous devez être administrateur.' 
        });
    }

    next();
};

module.exports = { verifyToken, verifyAdmin };
