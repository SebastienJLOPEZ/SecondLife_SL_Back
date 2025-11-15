require('dotenv').config();

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
        type: String,
        enum: ['category1', 'category2', 'category3'],
        required: true
    },
    status: {
        type: String,
        enum: ['listed', 'exchanged', 'removed'],
        default: 'listed'
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema, `${process.env.PRODUCT}`);