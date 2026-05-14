const mongoose = require('mongoose');

const LoadSchema = new mongoose.Schema({
  pickup:         { type: String, required: true },
  drop:           { type: String, required: true },
  weight:         { type: Number, required: true },
  urgency:        { type: String, required: true },
  cargo:          { type: String, required: true },
  customerName:   { type: String, required: true },
  customerPhone:  { type: String, required: true },
  price:          { type: Number },
  distanceKm:     { type: Number },
  pickupLat:      { type: Number, default: null },
  pickupLng:      { type: Number, default: null },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'In Transit', 'Delivered', 'Cancelled'],
    default: 'Pending'
  },
  assignedDriverId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Driver',  default: null },
  assignedVehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
  rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Load', LoadSchema);
