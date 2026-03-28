const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the frontend/public directory
app.use(express.static(path.join(__dirname, 'frontend', 'public')));

// Serve the index.html for all routes (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'public', 'index.html'));
});

const PORT = 3000;
app.listen(PORT, 'localhost', () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║            🎨 NeuroOps Frontend Server v2.5               ║
║              Running on http://localhost:3000              ║
╚════════════════════════════════════════════════════════════╝

🌐 Application is ready!
📊 Backend API: http://localhost:3001
🎯 Open your browser and visit: http://localhost:3000

To stop the server, press Ctrl+C
    `);
});

process.on('SIGINT', () => {
    console.log('\n✓ Frontend server stopped');
    process.exit(0);
});