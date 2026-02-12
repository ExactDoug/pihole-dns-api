const express = require('express');
const cors = require('cors');
const recordsRouter = require('./routes/records');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/', recordsRouter);

// Error handling
app.use(errorHandler);

module.exports = app;
