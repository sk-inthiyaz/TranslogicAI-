const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://skinthiyaz777:cRvz5HeMLGOOhUti@translogic-cluster.nb4z11i.mongodb.net/translogicDB?retryWrites=true&w=majority&appName=translogic-cluster', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = mongoose;