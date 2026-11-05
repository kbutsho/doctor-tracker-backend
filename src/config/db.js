const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

module.exports = async function connectDB() {
  await mongoose.connect(env.MONGODB_URI, {
    autoIndex: !env.isProd,
    maxPoolSize: 20,
  });
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
};
