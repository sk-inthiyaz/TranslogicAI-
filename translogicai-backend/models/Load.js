const mongoose = require('mongoose');

const LoadSchema = new mongoose.Schema({
  pickup: { type: String, required: true },
  drop: { type: String, required: true },
  weight: { type: Number, required: true },
  urgency: { type: String, required: true },
  cargo: { type: String, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  price: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Load', LoadSchema);
