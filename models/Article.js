require('dotenv').config();

const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    content : { type: String },
    images: [{ type: String }],
    video: { type: String },
    category: {
        type: String,
        enum: ['conseil', 'annonce', 'autre'], //will be changed using a json of themes
        required: true
    },
    type: {
        type: String,
        enum: ['news', 'blog', 'video'],
        required: true
    },
    writer: { type: String, required: true }, //Author could be outside of userbase
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Article', articleSchema, `${process.env.ARTICLE}`);

