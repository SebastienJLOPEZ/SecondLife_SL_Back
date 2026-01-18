require('dotenv').config();

const mongoose = require('mongoose');

const weeklyThemeSchema = new mongoose.Schema({
    lastTheme : { type: String, required: true },
    months: [{
        name: { type: String, required: true },
        themes: [{
            name: { type: String },
            weight: { type: Number }
        }]
    }]
});

module.exports = mongoose.model('WeeklyTheme', weeklyThemeSchema, `${process.env.WEEKLYTHEME}`);