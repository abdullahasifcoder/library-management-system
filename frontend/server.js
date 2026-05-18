const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
}));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Frontend serving UI on port ${PORT} and proxying /api to ${BACKEND_URL}`);
});
