const express = require('express');
const cors = require('cors');
const axios = require('axios');
const CMSDetector = require('./engines/detector');
const VillageExtractor = require('./engines/extractor');
const WilayahSync = require('./integration/wilayah_sync');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const wilayahSync = new WilayahSync();

app.post('/api/scan', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        console.log(`Scanning: ${url}`);

        // 1. Detect CMS
        const detector = new CMSDetector(url);
        const detectResults = await detector.detect();

        let extractedInfo = {};
        let wilayahMatch = { matched: false };

        // 2. Extract Data if site is up
        if (detectResults.status_code === 200) {
            try {
                const response = await axios.get(url, { timeout: 10000 });
                const extractor = new VillageExtractor(response.data, url);
                extractedInfo = extractor.extractAll();

                // 3. Match Wilayah (Full Indonesia DB)
                wilayahMatch = wilayahSync.matchVillage(extractedInfo);
            } catch (err) {
                console.warn(`Extraction failed for ${url}: ${err.message}`);
            }
        }

        // 4. Combine results
        const finalOutput = {
            url: url,
            cms: detectResults.primary_cms || { name: 'Unknown', confidence: 0 },
            info: extractedInfo,
            region: wilayahMatch,
            status_code: detectResults.status_code,
            timestamp: new Date().toLocaleString('id-ID'),
            ip: detectResults.ip || '0.0.0.0' // IP usually comes from detector if implemented
        };

        res.json(finalOutput);
    } catch (err) {
        console.error('Scan error:', err);
        res.status(500).json({ error: 'Internal server error during scan' });
    }
});

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
