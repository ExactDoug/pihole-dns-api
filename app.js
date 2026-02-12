const express = require('express');
const cors = require('cors');
const requestLogger = require('./middleware/requestLogger');
const healthRouter = require('./routes/health');
const auth = require('./middleware/auth');
const recordsRouter = require('./routes/records');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check (no auth required)
app.use('/', healthRouter);

// Auth middleware (applied to all routes below)
app.use(auth);

// Protected routes
app.use('/', recordsRouter);

// Error handling
app.use(errorHandler);

module.exports = app;
