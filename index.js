const app = require('./app');
const config = require('./config');

app.listen(config.port, () => {
  console.log(`Pi-hole DNS API running on http://localhost:${config.port}`);
});
