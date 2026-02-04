const express = require('express');
const router = express.Router();
const WeeklyTheme = require('../models/WeeklyTheme');

router.get('/', async (req, res) => {
    try {
        const weeklyThemes = await WeeklyTheme.findOne().sort({ _id: -1 });
        res.status(200).json({
            success: true,
            theme: weeklyThemes.lastTheme
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des thèmes hebdomadaires:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

router.post('/update', async (req, res) => {
    const { newTheme } = req.body;
    try {
        const updatedTheme = new WeeklyTheme({
            lastTheme: newTheme,

        });
        await updatedTheme.save();
        res.status(200).json({
            success: true,
            message: 'Thème hebdomadaire mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du thème hebdomadaire:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

router.get('/month', async (req, res) => {
    try {
        const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        const currentMonth = monthNames[new Date().getMonth()];

        const weeklyThemes = await WeeklyTheme.findOne()
        .sort({ _id: -1 });

        console.log('Thèmes hebdomadaires récupérés :', weeklyThemes.months[0].name, weeklyThemes.months[0].themes);
        console.log('Mois actuel :', currentMonth);

        const currentMonthThemes = weeklyThemes.months.find(m => m.name === currentMonth);
        console.log('Thèmes du mois actuel :', currentMonthThemes);

        res.status(200).json({
            success: true,
            data: currentMonthThemes ? currentMonthThemes.themes : []
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des thèmes mensuels:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

module.exports = router;