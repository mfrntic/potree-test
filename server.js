const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// MIME type configuration
express.static.mime.define({'text/css': ['css']});
express.static.mime.define({'application/javascript': ['js']});

// Debug middleware to log requested paths
app.use((req, res, next) => {
    console.log(`Requested: ${req.path}`);
    next();
});

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve node_modules directories
app.use('/libs/jquery', express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.use('/libs/jquery-ui', express.static(path.join(__dirname, 'node_modules/jquery-ui-dist')));
app.use('/libs/jstree', express.static(path.join(__dirname, 'node_modules/jstree/dist')));
app.use('/libs/three.js', express.static(path.join(__dirname, 'node_modules/three/build')));

// Serve Potree files
app.use('/potree-core', express.static(path.join(__dirname, 'node_modules/potree-core')));
app.use('/potree', express.static(path.join(__dirname, 'node_modules/potree')));

// Add CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Add error handling
app.use((req, res, next) => {
    console.log(`404: ${req.url}`);
    res.status(404).send('File not found');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    // Log the actual paths being used
    console.log('Serving libraries from:');
    console.log('jQuery:', path.join(__dirname, 'node_modules/jquery/dist'));
    console.log('Three.js:', path.join(__dirname, 'node_modules/three/build'));
    console.log('Potree-Core:', path.join(__dirname, 'node_modules/potree-core'));
    console.log('Potree:', path.join(__dirname, 'node_modules/potree'));
}); 