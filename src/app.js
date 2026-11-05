const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiters');

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(cors({ origin: env.CLIENT_URLS, credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
if (!env.isProd) app.use(morgan('dev'));

app.use('/api', apiLimiter, routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
