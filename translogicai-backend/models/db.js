const mongoose = require('mongoose');

// Register models before connecting
require('./Vehicle');
require('./Driver');
require('./Customer');

// More detailed MongoDB connection options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  family: 4 // Use IPv4, skip trying IPv6
};

mongoose.connect(process.env.MONGODB_URI, options)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit if we can't connect to the database
  });

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
  // Try to reconnect automatically
  setTimeout(() => {
    console.log('Attempting to reconnect to MongoDB...');
    mongoose.connect(process.env.MONGODB_URI, options);
  }, 5000);
});

db.on('disconnected', () => {
  console.log('🔌 MongoDB disconnected');
});

db.once('open', function() {
  console.log('✅ MongoDB connected successfully');
  // Log some diagnostic info
  console.log('MongoDB connection state:', mongoose.connection.readyState);
  console.log('MongoDB host:', mongoose.connection.host);
  console.log('MongoDB port:', mongoose.connection.port);
});

module.exports = mongoose;