const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');

class WilayahSync {
    constructor() {
        this.dbPath = path.join(__dirname, '../database/wilayah/villages_full.json');
        this.vilData = [];
        this.fuse = null;
        this.loadDatabase();
    }

    loadDatabase() {
        try {
            if (fs.existsSync(this.dbPath)) {
                this.vilData = JSON.parse(fs.readFileSync(this.dbPath, 'utf-8'));
                this.fuse = new Fuse(this.vilData, {
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
        const { nama_desa, kecamatan, kabupaten, provinsi } = extractedInfo;
        if (!nama_desa) return { matched: false, reason: 'No village name extracted' };
        if (!this.fuse) return { matched: false, reason: 'Database not initialized' };

        // 1. Initial Search
        let candidates = this.fuse.search(nama_desa);

        // 2. Filter by extracted context (if available) for better accuracy
        if (candidates.length > 0) {
            let filteredResults = candidates;

            if (kecamatan) {
                const kecLow = kecamatan.toLowerCase();
                filteredResults = filteredResults.filter(c =>
                    c.item.kecamatan.toLowerCase().includes(kecLow) || kecLow.includes(c.item.kecamatan.toLowerCase())
                );
            }

            if (filteredResults.length === 0 && kabupaten) {
                // Fallback to kabupaten if kecamatan filtering was too aggressive
                const kabLow = kabupaten.toLowerCase();
                filteredResults = candidates.filter(c =>
                    c.item.kabupaten.toLowerCase().includes(kabLow) || kabLow.includes(c.item.kabupaten.toLowerCase())
                );
            }

            const finalResults = filteredResults.length > 0 ? filteredResults : candidates;
            const bestMatch = finalResults[0].item;
            const confidence = Math.round((1 - finalResults[0].score) * 100);

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
                }
            };
        }

        return { matched: false, reason: 'No confident match found in Kemendagri DB' };
    }
}

module.exports = WilayahSync;
