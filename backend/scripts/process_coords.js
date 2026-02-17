const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function downloadAndProcess() {
    const url = 'https://raw.githubusercontent.com/kurzzt/Indonesian-Postal-and-Geolocation-Data/master/data/coll/kelurahan_lat_long.csv';
    const outputDir = path.join(__dirname, '../database/wilayah');
    const outputPath = path.join(outputDir, 'villages_coords.json');

    console.log('Downloading village coordinates from:', url);

    try {
        const response = await axios.get(url, { responseType: 'text' });
        const lines = response.data.split('\n');
        const points = [];

        // skip header: ,id,foreign,name,lat,long
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(',');
            // Format: id_row, id_kemendagri, id_kec, name, lat, long
            // parts[4] is lat, parts[5] is long
            const lat = parseFloat(parts[4]);
            const lng = parseFloat(parts[5]);

            if (!isNaN(lat) && !isNaN(lng)) {
                // Store as small arrays to save bandwidth [lat, lng]
                // We could also store name/id but let's start with just points for density
                points.push([
                    parseFloat(lat.toFixed(6)),
                    parseFloat(lng.toFixed(6))
                ]);
            }
        }

        fs.writeFileSync(outputPath, JSON.stringify(points));
        console.log(`Successfully processed ${points.length} points to ${outputPath}`);
    } catch (error) {
        console.error('Error processing coordinates:', error.message);
    }
}

downloadAndProcess();
