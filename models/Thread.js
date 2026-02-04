require('dotenv').config();

const mongoose = require('mongoose');
const { type } = require('os');

// Schéma pour les threads de discussion (privés et forums)
const threadSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    poster: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    messages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        citation: { type: Boolean, default: false },
        citedMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
        timestamp: { type: Date, default: Date.now }
    }],
    status: {
        type: String,
        enum: ['active', 'closed'],
        default: 'active'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Thread', threadSchema, `${process.env.THREAD}`);