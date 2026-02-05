const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Offer = require('../models/Offer');
const Negociation = require('../models/Negociation');

// Route spécifique /user/ doit être AVANT les routes avec paramètres dynamiques
router.get('/user/', async (req, res) => {
    const accessToken = req.headers.authorization?.split(' ')[1];
    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decoded.userId;

        // Utiliser $or pour trouver toutes les négociations où l'utilisateur participe
        // sans créer de doublons
        const negociations = await Negociation.find({
            $or: [
                { 'messages.sender': userId },
                { 'messages.receiver': userId }
            ]
        })
        .populate('productRef', 'title')
        .populate('messages.sender', 'name surname')
        .populate('messages.receiver', 'name surname')
        .sort({ updatedAt: -1 }); // Trier directement dans la requête

        return res.status(200).json({ negociations });
    } catch (error) {
        console.error('Error fetching negociations:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/:offerId/', async (req, res) => {
    const { offerId } = req.params;
    const { message } = req.body;
    const accessToken = req.headers.authorization?.split(' ')[1];
    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const offer = await Offer.findById(offerId);
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        const negociation = await Negociation.findOne({ productRef: offerId});
        if (negociation && negociation.messages?.[0]?.sender?.toString() === userId) {
            return res.status(404).json({ message: 'Negociation already exist' });
        }

        const newNegociation = new Negociation({
            productRef: offerId,
            messages: [{ sender: userId, receiver: offer.owner, content: message, timestamp: new Date() }],
            createdAt: new Date()
        });
        await newNegociation.save();
        res.status(201).json({ message: 'Negociation started successfully', negociationId: newNegociation._id });
    } catch (error) {
        console.error('Error starting negociation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/:offerId/', async (req, res) => {
    const { offerId } = req.params;
    const accessToken = req.headers.authorization?.split(' ')[1];
    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);

        if (!decoded) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const negociation = await Negociation.findOne({ productRef: offerId })
        .populate('messages.sender', 'name surname')
        .populate('messages.receiver', 'name surname');
        if (!negociation) {
            return res.status(404).json({ message: 'Negociation not found' });
        }

        return res.status(200).json({ negociation });
    } catch (error) {
        console.error('Error fetching negociation:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/:offerId/', async (req, res) => {
    const { offerId } = req.params;
    const { message } = req.body;
    const accessToken = req.headers.authorization?.split(' ')[1];
    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decoded.userId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const negociation = await Negociation.findOne({ 
            productRef: offerId,
            $or: [
                { 'messages.sender': userId },
                { 'messages.receiver': userId }
            ]
        });
        if (!negociation) {
            return res.status(404).json({ message: 'Negociation not found' });
        }

        // Déterminer le destinataire : c'est l'autre utilisateur dans la conversation
        const lastMessage = negociation.messages[negociation.messages.length - 1];
        const receiver = lastMessage.sender.toString() === userId 
            ? lastMessage.receiver 
            : lastMessage.sender;

        negociation.messages.push({ 
            sender: userId, 
            receiver: receiver, 
            content: message, 
            timestamp: new Date() 
        });
        negociation.updatedAt = new Date();
        await negociation.save();
        return res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;