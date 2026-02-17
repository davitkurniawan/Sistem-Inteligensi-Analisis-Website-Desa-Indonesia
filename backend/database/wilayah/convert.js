const fs = require('fs');
const path = require('path');

const RAW_DIR = path.join(__dirname, 'raw');
const OUTPUT_FILE = path.join(__dirname, 'villages_full.json');

function parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const header = lines[0].split(',');
    const results = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        // Simple comma split (assuming no commas in names, which is mostly true for administrative data, 
        // but we might need to handle quoted strings if they exist. Based on view_file, they don't seem to be quoted).
        const values = lines[i].split(',');
        const obj = {};
        header.forEach((h, index) => {
            obj[h.trim()] = values[index].trim();
        });
        results.push(obj);
    }
    return results;
}

async function convert() {
    console.log('Loading raw CSVs...');
    const provinces = parseCSV(path.join(RAW_DIR, 'provinces.csv'));
    const regencies = parseCSV(path.join(RAW_DIR, 'regencies.csv'));
    const districts = parseCSV(path.join(RAW_DIR, 'districts.csv'));
    const villages = parseCSV(path.join(RAW_DIR, 'villages.csv'));

    console.log('Indexing parents...');
    const provMap = {};
    provinces.forEach(p => provMap[p.code] = p.name);

    const regMap = {};
    regencies.forEach(r => regMap[r.code] = { name: r.name, provTitle: provMap[r.province_code] });

    const distMap = {};
    districts.forEach(d => {
        const parent = regMap[d.regency_code] || {};
        distMap[d.code] = {
            name: d.name,
            regTitle: parent.name,
            provTitle: parent.provTitle
        };
    });

    console.log(`Processing ${villages.length} villages...`);
    const fullData = villages.map(v => {
        const parent = distMap[v.district_code] || {};
        return {
            kode: v.code,
            desa: v.name,
            kecamatan: parent.name || '',
            kabupaten: parent.regTitle || '',
            provinsi: parent.provTitle || ''
        };
    });

    console.log(`Writing consolidated JSON to ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fullData, null, 2));
    console.log('Conversion complete!');
}

convert();
