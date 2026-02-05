const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

router.get('/profile', async (req, res) => {
    const accessToken = req.headers.authorization?.split(' ')[1];
    console.log('[User Route] Access Token:', accessToken ? 'présent' : 'absent');
    
    if (!accessToken) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        console.log('[User Route] Token décodé, userId:', decoded.userId);
        
        const user = await User.findById(decoded.userId).select('name surname email address');

        if (!user) {
            console.log('[User Route] Utilisateur non trouvé');
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }
        
        console.log('[User Route] Utilisateur trouvé:', user.email);
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('[User Route] Erreur:', error.message);
        return res.status(401).json({ message: 'Invalid token', error: error.message });
    }
});

router.put('/profile', async (req, res) => {
    const accessToken = req.headers.authorization?.split(' ')[1];
    const { name, surname, email, password, address } = req.body;
    
    if (!accessToken) {
        return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Mettre à jour uniquement les champs fournis
        if (name && name !== '') user.name = name;
        if (surname && surname !== '') user.surname = surname;
        if (email && email !== '') user.email = email;
        if (password && password !== '') {
            user.password = await bcrypt.hash(password, 10);
        }
        if (address !== undefined) {
            user.address = {
                region: address.region,
                department: address.department,
                city: address.city,
                postalCode: address.postalCode
            };
        }
        
        user.updatedAt = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profil mis à jour avec succès',
            data: {
                name: user.name,
                surname: user.surname,
                email: user.email,
                address: user.address
            }
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du profil',
            error: error.message
        });
    }
});

router.delete('/delete', async (req, res) => {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }
        await user.remove();

        res.status(200).json({
            success: true,
            message: 'Compte supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du compte:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du compte'
        });
    }
});



module.exports = router;