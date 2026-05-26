const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  driverId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  type:      { type: String, required: true }, // 'vehicle_activated', 'vehicle_rejected', etc.
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  read:      { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
