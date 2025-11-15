const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');

router.get('/', async (req, res) => {
    try {
        const products = await Product.find().populate('owner', 'name surname').populate('buyer', 'name surname');
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.post('/', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const { title, description, category} = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const owner = await User.findById(decoded.userId);
        if (!owner) {
            return res.status(404).json({ success: false, message: 'Aucun utilisateur trouvé' });
        }

        const newProduct = new Product({ title, description, category, owner: decoded.userId });
        await newProduct.save();

        res.status(201).json({ success: true, data: newProduct });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// TODO:
// Route affichant tous les produits possédés
// Route affichant tous les produits que l'on a échangés (reçus)
// Router affichant les produits selon le thème du mois
// Route pour échanger un produit (mettre à jour le statut et le buyer)
// Route pour supprimer un produit (mettre à jour le statut)

module.exports = router;