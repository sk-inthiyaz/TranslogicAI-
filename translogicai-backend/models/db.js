const mongoose = require('mongoose');

// Pre-register all models so they are available before any connection
require('./Vehicle');
require('./Driver');
require('./Customer');

module.exports = mongoose;