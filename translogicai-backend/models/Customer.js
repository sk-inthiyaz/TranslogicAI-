const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  address: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Customer', customerSchema);
