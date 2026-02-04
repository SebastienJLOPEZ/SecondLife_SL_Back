const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Thread = require('../models/Thread');
const { parse } = require('dotenv');
const jwt = require('jsonwebtoken');

router.get('/add', async (req, res) => { // Crée un nouveau thread
    const { subject, posterId, firstMessageContent } = req.body;

    try {
        const newThread = new Thread({
            subject: subject,
            poster: posterId,
            messages: [{
                sender: posterId,
                content: firstMessageContent,
                timestamp: new Date()
            }]
        });
        await newThread.save();
        res.status(201).json({
            success: true,
            message: 'Thread créé avec succès',
            thread: newThread
        });
    } catch (error) {
        console.error('Erreur lors de la création du thread:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du thread'
        });
    }
});

router.get('/admin', async (req, res) => { // Récupère les threads d'admin, aka les fixes
    try {
        // Récupère tous les IDs des utilisateurs admins
        const admins = await User.find({ role: 'admin' }).select('_id');
        const adminIds = admins.map(admin => admin._id.toString());

        // Récupère tous les threads créés par ces admins
        const adminThreads = await Thread.find()
            .populate('poster', 'name surname')
            .sort({ createdAt: -1 });

        // Filtrer côté application pour s'assurer que poster.role est admin
        const filteredThreads = adminThreads.filter(thread => 
            thread.poster && adminIds.includes(thread.poster._id.toString())
        );

        res.status(200).json({
            success: true,
            threads: filteredThreads
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des threads admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des threads admin'
        });
    }
});

router.get('/', async (req, res) => { // Récupère tous les threads hors ceux admins
    try {
        const admins = await User.find({ role: 'admin' }).select('_id');
        const adminIds = admins.map(admin => admin._id.toString());

        const {page = 1, limit = 10} = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Récupérer tous les threads et filtrer côté application
        const allThreads = await Thread.find()
            .populate('poster', 'name surname')
            .sort({ createdAt: -1 });

        // Filtrer pour exclure les threads des admins
        const filteredThreads = allThreads.filter(thread => 
            thread.poster && !adminIds.includes(thread.poster._id.toString())
        );

        const total = filteredThreads.length;
        const threads = filteredThreads.slice(skip, skip + parseInt(limit));

        res.status(200).json({
            success: true,
            threads: threads,
            pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.max(1, Math.ceil(total / limit))  }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des threads:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des threads'
        });
    }
});

router.get('/:id', async (req, res) => { // Récupère un thread par son ID
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const thread = await Thread.findById(req.params.id)
            .populate('poster', 'name surname')
            .populate('messages.sender', 'name surname');

        if (!thread) {
            return res.status(404).json({
                success: false,
                message: 'Thread non trouvé'
            });
        }

        // Séparer le message le plus ancien (premier message)
        const firstMessage = thread.messages.length > 0 ? thread.messages[0] : null;

        // Calculer la pagination pour les autres messages
        const otherMessages = thread.messages.slice(1);
        const totalMessages = otherMessages.length;
        const paginatedMessages = otherMessages.slice(skip, skip + parseInt(limit));

        res.status(200).json({
            success: true,
            thread: {
                _id: thread._id,
                subject: thread.subject,
                poster: thread.poster,
                firstMessage: firstMessage,
                messages: paginatedMessages,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalMessages: totalMessages,
                    totalPages: Math.ceil(totalMessages / parseInt(limit)) || 1
                }
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du thread:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du thread'
        });
    }
});

router.put('/:id/close', async (req, res) => { // Ferme un thread
    try {
        const thread = await Thread.findById(req.params.id);
        if (!thread) {
            return res.status(404).json({
                success: false,
                message: 'Thread non trouvé'
            });
        }
        thread.status = 'closed';
        thread.updatedAt = new Date();
        await thread.save();

        res.status(200).json({
            success: true,
            message: 'Thread fermé avec succès',
            thread: thread
        });
    } catch (error) {
        console.error('Erreur lors de la fermeture du thread:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la fermeture du thread'
        });
    }
});

router.put('/:id/message', async (req, res) => { // Ajoute un message à un thread
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const {content, citation, citedMessage } = req.body;

    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const userId = decoded.userId;
        const thread = await Thread.findById(req.params.id);
        if (!thread) {
            return res.status(404).json({
                success: false,
                message: 'Thread non trouvé'
            });
        }

        let newMessage = { sender: userId, title: "re: " + thread.subject, content: content, timestamp: new Date() };

        if (citation) {
            newMessage.citation = true;
            newMessage.citedMessage = citedMessage;
        }

        thread.messages.push(newMessage);
        thread.updatedAt = new Date();
        await thread.save();

        res.status(200).json({
            success: true,
            message: 'Message ajouté au thread avec succès',
            thread: thread
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout du message au thread:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout du message au thread'
        });
    }
});

module.exports = router;