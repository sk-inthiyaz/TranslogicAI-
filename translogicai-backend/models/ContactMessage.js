const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, default: '' },
  phone:      { type: String, default: '' },
  subject:    { type: String, required: true },
  message:    { type: String, required: true },
  senderType: { type: String, enum: ['customer', 'driver'], default: 'customer' },
  senderId:   { type: String, default: null }, // ObjectId string if logged in
  read:       { type: Boolean, default: false },
  createdAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
