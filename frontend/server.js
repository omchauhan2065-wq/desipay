/**
 * DesiPay Dashboard — Static Server
 * Serves the frontend SPA on port 3001
 */

const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(express.static(path.join(__dirname, 'public')));

// SPA fallback — serve index.html for all routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🖥️  DesiPay Dashboard running at http://localhost:${PORT}`);
});
