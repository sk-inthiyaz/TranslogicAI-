const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  vehicleNumber: { type: String, required: true },
  vehicleName: { type: String, required: true },
  capacity: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Activated', 'Rejected'], default: 'Pending' },
  files: {
    permit: String,
    rc: String,
    fitness: String,
    puc: String,
    insurance: String,
    vehicleImage: String,
    driverName: String,
    driverLicence: String,
    driverImage: String,
    tax: String // Add tax document path
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
