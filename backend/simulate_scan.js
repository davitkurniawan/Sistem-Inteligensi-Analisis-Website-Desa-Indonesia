// Web Detector CMS - Simulation Script
const CMSDetector = require('./engines/detector');
const VillageExtractor = require('./engines/extractor');
const SecurityScanner = require('./engines/security');
const WilayahSync = require('./integration/wilayah_sync');

// Mock Kemendagri Data for Testing
const MOCK_KEMENDAGRI_DB = [
    { kode_desa: '3515120001', nama_desa: 'Sidoraharjo', nama_kecamatan: 'Krian', nama_kabupaten: 'Sidoarjo', nama_provinsi: 'Jawa Timur' },
    { kode_desa: '3515120012', nama_desa: 'Sukomulyo', nama_kecamatan: 'Muchtar', nama_kabupaten: 'Gresik', nama_provinsi: 'Jawa Timur' },
    { kode_desa: '3201010001', nama_desa: 'Ciburial', nama_kecamatan: 'Cimenyan', nama_kabupaten: 'Bandung', nama_provinsi: 'Jawa Barat' }
];

async function runSimulation(targetUrl) {
    console.log(`\n=== Starting Scan for: ${targetUrl} ===`);

    // 1. CMS Detection
    const detector = new CMSDetector(targetUrl);
    // We mock the detect method result to avoid real network request for simulation
    const detectResults = {
        url_scanned: targetUrl,
        final_url: targetUrl,
        status_code: 200,
        cms_detected: [
            { name: 'OpenSID', variant: 'Premium', confidence: 95, methods: ['body_pattern'], evidence: ['opensid'] }
        ],
        primary_cms: { name: 'OpenSID', confidence: 95 }
    };
    console.log('✅ CMS Detected:', detectResults.primary_cms.name, `(${detectResults.primary_cms.confidence}%)`);

    // 2. Data Extraction
    // Mock HTML content for "Desa Sidoraharjo"
    const mockHtml = `
    <html>
      <head><title>Pemerintah Desa Sidoraharjo | Portal Resmi</title></head>
      <body>
        <h1>Selamat Datang di Desa Sidoraharjo</h1>
        <p>Kepala Desa: Bapak Subianto S.Kom</p>
        <p>Alamat Kantor: Jl. Raya Krian No. 45, Sidoraharjo, Sidoarjo</p>
        <p>Kontak: 0812-3456-7890 | email: pemdes.sidoraharjo@gmail.com</p>
      </body>
    </html>
  `;
    const extractor = new VillageExtractor(mockHtml, targetUrl);
    const extractedInfo = extractor.extractAll();
    console.log('✅ Info Extracted:', extractedInfo.nama_desa, `(Kades: ${extractedInfo.kepala_desa})`);

    // 3. Security Scan
    const scanner = new SecurityScanner(targetUrl);
    // We'll mock part of it since we can't do real port scanning in this env
    const securityResults = {
        score: 85,
        risk_level: 'safe',
        ssl: { valid: true, version: 'TLS v1.3' },
        missing_headers: ['CSP missing']
    };
    console.log('✅ Security Score:', securityResults.score, `(${securityResults.risk_level})`);

    // 4. Wilayah Integration (Kemendagri)
    const sync = new WilayahSync(MOCK_KEMENDAGRI_DB);
    const wilayahMatch = sync.matchVillage(extractedInfo);
    console.log('✅ Wilayah Match:', wilayahMatch.matched ? `${wilayahMatch.nama_wilayah.desa} (${wilayahMatch.confidence}%)` : 'No Match');

    // Unified Result
    const finalOutput = {
        url: targetUrl,
        cms: detectResults.primary_cms,
        info: extractedInfo,
        security: securityResults,
        region: wilayahMatch
    };

    console.log('\n--- FINAL SCAN DATA (JSON) ---');
    console.log(JSON.stringify(finalOutput, null, 2));
}

// Run the demo
runSimulation('https://sidoraharjo-krian.desa.id');
