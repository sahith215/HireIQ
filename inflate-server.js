// inflate-server.js — Local DEFLATE decompression service for HireIQ
// Runs alongside n8n, accepts compressed bytes, returns raw PDF bytes
// Start with: node inflate-server.js

const http = require('http');
const zlib = require('zlib');

const PORT = 3001;

const server = http.createServer((req, res) => {
    if (req.method !== 'POST' || req.url !== '/inflate') {
        res.writeHead(404);
        res.end('Not found');
        return;
    }

    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
        const compressed = Buffer.concat(chunks);

        zlib.inflateRaw(compressed, (err, decompressed) => {
            if (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
                return;
            }

            // Verify it's a PDF
            const magic = decompressed.slice(0, 4).toString('ascii');
            if (!magic.startsWith('%PDF')) {
                res.writeHead(422, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Decompressed bytes are not a valid PDF', magic }));
                return;
            }

            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Length': decompressed.length,
                'X-File-Size': decompressed.length
            });
            res.end(decompressed);
        });
    });

    req.on('error', err => {
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`HireIQ Inflate Server running at http://127.0.0.1:${PORT}/inflate`);
    console.log('Ready to decompress DEFLATE-compressed ZIP entries.');
});