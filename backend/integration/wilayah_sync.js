const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');

const PROVINCE_COORDS = {
    'Aceh': { lat: 4.6951, lng: 96.7494 },
    'Sumatera Utara': { lat: 2.1121, lng: 99.3923 },
    'Sumatera Barat': { lat: -0.7399, lng: 100.8000 },
    'Riau': { lat: 0.5071, lng: 101.4478 },
    'Jambi': { lat: -1.6101, lng: 103.6131 },
    'Sumatera Selatan': { lat: -3.3194, lng: 104.9147 },
    'Bengkulu': { lat: -3.7928, lng: 102.2608 },
    'Lampung': { lat: -4.8555, lng: 105.0300 },
    'Kepulauan Bangka Belitung': { lat: -2.7410, lng: 106.4406 },
    'Kepulauan Riau': { lat: 3.9457, lng: 108.1429 },
    'DKI Jakarta': { lat: -6.2088, lng: 106.8456 },
    'Jawa Barat': { lat: -6.9147, lng: 107.6098 },
    'Jawa Tengah': { lat: -7.0623, lng: 110.3204 },
    'DI Yogyakarta': { lat: -7.8753, lng: 110.4262 },
    'Jawa Timur': { lat: -7.5361, lng: 112.2384 },
    'Banten': { lat: -6.4058, lng: 106.0600 },
    'Bali': { lat: -8.3405, lng: 115.0920 },
    'Nusa Tenggara Barat': { lat: -8.6529, lng: 117.3616 },
    'Nusa Tenggara Timur': { lat: -8.6574, lng: 121.0794 },
    'Kalimantan Barat': { lat: -0.2789, lng: 109.9754 },
    'Kalimantan Tengah': { lat: -1.6815, lng: 113.3824 },
    'Kalimantan Selatan': { lat: -3.0926, lng: 115.2838 },
    'Kalimantan Timur': { lat: 1.2735, lng: 116.5264 },
    'Kalimantan Utara': { lat: 3.0714, lng: 116.0414 },
    'Sulawesi Utara': { lat: 1.0720, lng: 124.2210 },
    'Sulawesi Tengah': { lat: -1.4300, lng: 121.4456 },
    'Sulawesi Selatan': { lat: -3.6688, lng: 119.9740 },
    'Sulawesi Tenggara': { lat: -4.1449, lng: 122.1746 },
    'Gorontalo': { lat: 0.6999, lng: 122.4467 },
    'Sulawesi Barat': { lat: -2.8441, lng: 119.2321 },
    'Maluku': { lat: -3.2385, lng: 130.1453 },
    'Maluku Utara': { lat: 1.5709, lng: 127.8088 },
    'Papua': { lat: -4.2699, lng: 138.0804 },
    'Papua Barat': { lat: -1.3361, lng: 132.9345 },
    'Papua Selatan': { lat: -7.5133, lng: 139.6386 },
    'Papua Tengah': { lat: -3.7661, lng: 136.2155 },
    'Papua Pegunungan': { lat: -4.0177, lng: 139.1165 },
    'Papua Barat Daya': { lat: -0.9161, lng: 131.2581 }
};

class WilayahSync {
    constructor() {
        this.dbPath = path.join(__dirname, '../database/wilayah/villages_full.json');
        this.villages = [];
        this.fuse = null;
        this.loadDatabase();
    }

    loadDatabase() {
        try {
            if (fs.existsSync(this.dbPath)) {
                this.villages = JSON.parse(fs.readFileSync(this.dbPath, 'utf-8'));
                this.fuse = new Fuse(this.villages, {
                    keys: ['desa', 'kecamatan'],
                    threshold: 0.3,
                    includeScore: true
                });
            } else {
                console.warn('Wilayah database not found at:', this.dbPath);
            }
        } catch (err) {
            console.error('Error loading wilayah database:', err.message);
        }
    }

    /**
     * Matches extracted info with Kemendagri database
     */
    matchVillage(extractedInfo) {
        if (!extractedInfo.nama_desa) return { matched: false, reason: "No village name extracted" };

        const searchName = this.normalizeName(extractedInfo.nama_desa);
        const searchKec = extractedInfo.kecamatan ? this.normalizeName(extractedInfo.kecamatan) : null;
        const searchKab = extractedInfo.kabupaten ? this.normalizeName(extractedInfo.kabupaten) : null;

        if (!this.villages || this.villages.length === 0) return { matched: false, reason: 'Database not initialized or empty' };

        // Higher threshold for fuzzy matching (more tolerant)
        const fuse = new Fuse(this.villages, {
            keys: ['desa'], // Only search by desa name initially
            includeScore: true,
            threshold: 0.4, // Increased threshold
            useExtendedSearch: true
        });

        // 1. Initial search by village name
        let results = fuse.search(searchName);

        // 2. Filter by extracted context (if available) for better accuracy
        let filteredResults = results;

        if (searchKec) {
            filteredResults = filteredResults.filter(c =>
                this.normalizeName(c.item.kecamatan).includes(searchKec) || searchKec.includes(this.normalizeName(c.item.kecamatan))
            );
        }

        if (filteredResults.length === 0 && searchKab) {
            // Fallback to kabupaten if kecamatan filtering was too aggressive or not available
            filteredResults = results.filter(c =>
                this.normalizeName(c.item.kabupaten).includes(searchKab) || searchKab.includes(this.normalizeName(c.item.kabupaten))
            );
        }

        const finalResults = filteredResults.length > 0 ? filteredResults : results;

        if (finalResults.length > 0) {
            const bestMatch = finalResults[0].item;
            const score = finalResults[0].score;
            const confidence = Math.round((1 - score) * 100);

            // Minimum confidence threshold
            if (confidence < 40) return { matched: false, reason: "Confidence too low" };

            const coords = PROVINCE_COORDS[bestMatch.provinsi] || { lat: -4.8555, lng: 105.0300 };

            return {
                matched: true,
                confidence,
                kode_wilayah: {
                    desa: bestMatch.kode
                },
                nama_wilayah: {
                    provinsi: bestMatch.provinsi,
                    kabupaten: bestMatch.kabupaten,
                    kecamatan: bestMatch.kecamatan,
                    desa: bestMatch.desa
                },
                coords: {
                    lat: coords.lat + (Math.random() - 0.5) * 0.1, // Add slight jitter to center
                    lng: coords.lng + (Math.random() - 0.5) * 0.1
                }
            };
        }

        return { matched: false, reason: "No confident match found in Kemendagri DB" };
    }

    normalizeName(name) {
        if (!name) return "";
        return name.toLowerCase()
            .replace(/^(?:desa|kelurahan|pekon|gampong|nagari|kecamatan|kec\.|kabupaten|kab\.|kota)\s+/i, "")
            .trim();
    }
}

module.exports = WilayahSync;
