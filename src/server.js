const mongoose = require('mongoose');
const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

(async () => {
  await connectDB();
  const server = app.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}/api`));

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (err) => { console.error('Unhandled rejection:', err); shutdown('unhandledRejection'); });
})().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
