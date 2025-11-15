require('dotenv').config();

const mongoose = require('mongoose');
const { type } = require('os');

const threadSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    messages: [{
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    type: {
        type: String,
        enum: ['private', 'forum'],
        required: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Thread', threadSchema, `${process.env.THREAD}`);