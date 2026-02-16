// Web Detector CMS - Backend Integration: Wilayah Sync (Kemendagri)
const Fuse = require('fuse.js');

class WilayahSync {
    constructor(wilayahData = []) {
        this.wilayahData = wilayahData; // Official Kemendagri list
        this.fuse = new Fuse(wilayahData, {
            keys: ['nama_desa', 'nama_kecamatan'],
            threshold: 0.4,
            includeScore: true
        });
    }

    /**
     * Matches extracted info with Kemendagri database
     */
    matchVillage(extractedInfo) {
        const { nama_desa, alamat } = extractedInfo;
        if (!nama_desa) return { matched: false, reason: 'No village name extracted' };

        const results = this.fuse.search(nama_desa);

        if (results.length > 0) {
            const bestMatch = results[0].item;
            const confidence = Math.round((1 - results[0].score) * 100);

            return {
                matched: true,
                confidence,
                kode_wilayah: {
                    provinsi: bestMatch.kode_provinsi,
                    kabupaten: bestMatch.kode_kabupaten,
                    kecamatan: bestMatch.kode_kecamatan,
                    desa: bestMatch.kode_desa
                },
                nama_wilayah: {
                    provinsi: bestMatch.nama_provinsi,
                    kabupaten: bestMatch.nama_kabupaten,
                    kecamatan: bestMatch.nama_kecamatan,
                    desa: bestMatch.nama_desa
                }
            };
        }

        return { matched: false, reason: 'No confident match found in Kemendagri DB' };
    }
}

module.exports = WilayahSync;
