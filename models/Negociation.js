require('dotenv').config();

const mongoose = require('mongoose');

// Schéma pour les messages privés entre utilisateurs
const negociationSchema = new mongoose.Schema({
    productRef : { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
    messages: [{
            sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            content: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }],
    createdAt: { type: Date, default: Date.now }, // La date du début de la conversation
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Negociation', negociationSchema, `${process.env.NEGOCIATION}`);