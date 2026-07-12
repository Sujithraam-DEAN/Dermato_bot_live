const mongoose = require('mongoose');

const embeddingSchema = new mongoose.Schema({
  chunk: String,
  embedding: [Number],
  index: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Embedding', embeddingSchema);