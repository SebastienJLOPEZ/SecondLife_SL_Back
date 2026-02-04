require('dotenv').config();

const mongoose = require('mongoose');

// Schéma pour les produits listés par les utilisateurs
const offerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String }],
    category: {
        type: String,
        enum: ['electronique', 'mobilier', 'vêtements', 'livres', 'autres'], //will be changed using a json of themes
        required: true
    },
    type: {
        type: String,
        enum: ['troc', 'don', 'vente'],
        required: true
    },
    demand: { type: String },
    price: { type: Number},
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
        type: String,
        enum: ['listed', 'exchanged', 'removed'],
        default: 'listed'
    },
    note: [{type: Number}],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Offer', offerSchema, `${process.env.OFFER}`);