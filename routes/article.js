const express = require('express');
const Article = require('../models/Article');
const User = require('../models/User');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const router = express.Router();

router.post('/add', verifyToken, verifyAdmin, async (req, res) => {
    
    try {
        const authorId = req.user._id;

        const user = await User.findById(authorId).select('name');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        const { title, category, type, content, description, video } = req.body;

        const newArticle = new Article({
            title,
            category,
            type,
            writer: user.name,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        if (type === 'video') {
            newArticle.video = video;
        } else {
            newArticle.content = content;
            newArticle.description = description;
        }

        await newArticle.save();
        res.status(201).json({
            success: true,
            message: 'Article créé avec succès',
            article: newArticle
        });
    } catch (error) {
        console.error('Message:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'article'
        });
    }
});

router.get('/', async (req, res) => {
    try {
        const {page = 1, limit = 10} = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const articles = await Article.find().sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

        const total = await Article.countDocuments();
        res.status(200).json({
            success: true,
            articles,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des articles:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des articles'
        });
    }
});

router.get('/:id', async (req, res) => {
    const articleId = req.params.id;
    try {
        const article = await Article.findById(articleId);
        if (!article) {
            return res.status(404).json({
                success: false,
                message: 'Article non trouvé'
            });
        }
        res.status(200).json({
            success: true,
            article
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'article:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'article'
        });
    }
});

module.exports = router;