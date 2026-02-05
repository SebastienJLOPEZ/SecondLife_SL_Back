const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Offer = require('../models/Offer');
const { parse } = require('dotenv');
const jwt = require('jsonwebtoken');

router.get('/', async (req, res) => {
    try {
        const offers = await Offer.find().populate('owner', 'name surname').populate('buyer', 'name surname');
        res.status(200).json({ success: true, data: offers });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.post('/add', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const { title, description, category, type, demand, price, address } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const owner = await User.findById(decoded.userId);
        if (!owner) {
            return res.status(404).json({ success: false, message: 'Aucun utilisateur trouvé' });
        }

        const newOffer = new Offer({ title, description, category, owner: decoded.userId });

        if (type === 'vente' && price) {
            newOffer.type = 'vente';
            newOffer.price = price;
        } else if (type === 'troc' && demand) {
            newOffer.type = 'troc';
            newOffer.demand = demand;
        } else {
            newOffer.type = 'don';
        }

        if (address) {
            newOffer.address = {
                region: address.region,
                department: address.department,
                city: address.city,
            };
        }

        await newOffer.save();

        res.status(201).json({ success: true, data: newOffer });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.get('/list', async (req, res) => {
    try {
        const {page = 1, limit= 10} = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const accessToken = req.headers.authorization?.split(' ')[1];

        const query = { status: 'listed' };

        if (!!accessToken) {
            const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
            query.owner = { $ne: decoded.userId };
        }

        console.log('Query:', query);

        const offers = await Offer.find(query)
            .populate('owner', 'name surname')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Offer.countDocuments(query);

        res.status(200).json({ success: true, data: offers,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.max(1, Math.ceil(total / limit))  }
        });
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.get('/search', async (req, res) => {
    try {
        const {page = 1, limit= 10, category, types} = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const accessToken = req.headers.authorization?.split(' ')[1];

        const query = { status: 'listed' };

        if (category) 
            query.category = category;

        if (types) {
            const typesArray = types.split(',');
            query.type = { $in: typesArray };
        }

        console.log('Types:', query.types);

        if (!!accessToken) {
            const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
            query.owner = { $ne: decoded.userId };
        }

        console.log('Query:', query);

        const offers = await Offer.find(query)
            .populate('owner', 'name surname')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Offer.countDocuments(query);

        res.status(200).json({ success: true, data: offers,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.max(1, Math.ceil(total / limit))  }
        });
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.get('/my-offers', async (req, res) => {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decoded.userId;

        console.log(userId)

        const offersOwner = await Offer.find({ owner: userId }).populate('buyer', 'name surname');
        console.log(offersOwner);
        const offersBuyer = await Offer.find({ buyer: userId }).populate('owner', 'name surname');
        console.log(offersBuyer);

        res.status(200).json({ success: true, data: {
            owned: offersOwner,
            bought: offersBuyer,
            hasBrought: true
        } } );
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.put('/:id/note', async (req, res) => {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decoded.userId;
        const { rating } = req.body;

        let noteIndex;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

        const offer = await Offer.findById(req.params.id);

        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        if (!offer.note) {
            offer.note = [];
        }

        if (offer.owner.toString() === userId) {
            noteIndex = 0;
        } else if (offer.buyer && offer.buyer.toString() === userId) {
            noteIndex = 1;
        } else {
            return res.status(403).json({ success: false, message: 'Unauthorized to rate this offer' });
        }

        // Mettre à jour la note à l'index approprié
        offer.note[noteIndex] = rating;
        offer.updatedAt= Date.now();
        await offer.save();
        res.status(200).json({ success: true, data: offer, message: 'Note mise à jour avec succès' });
    } catch (error) {
        console.error('[Offer Note] Erreur:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id)
            .populate('owner', 'name surname')

        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        res.status(200).json({ success: true, data: offer });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.put('/:id/direct-response', async (req, res) => {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const offer = await Offer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found' });
        }

        const newBuyer = userId;

        offer.buyer = newBuyer;
        offer.status = 'exchanged';
        await offer.save();
        res.status(200).json({ success: true, data: offer });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
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