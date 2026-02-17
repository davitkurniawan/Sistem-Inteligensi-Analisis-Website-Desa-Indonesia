// Web Detector CMS - Backend Engine: Extractor
const cheerio = require('cheerio');

class VillageExtractor {
    constructor(html, url) {
        this.html = html;
        this.url = url;
        this.$ = cheerio.load(html);
    }

    extractAll() {
        return {
            nama_desa: this.extractNamaDesa(),
            kecamatan: this.extractKecamatan(),
            kabupaten: this.extractKabupaten(),
            provinsi: this.extractProvinsi(),
            kepala_desa: this.extractKepalaDesa(),
            kontak: this.extractKontak(),
            email: this.extractEmail(),
            jumlah_penduduk: this.extractJumlahPenduduk(),
            alamat: this.extractAlamat()
        };
    }

    extractNamaDesa() {
        const patterns = [
            /(?:desa|pekon|gampong|nagari|kelurahan)\s+([a-z\s]+)[,\s]*(?:kecamatan|kec\.)/i,
            /pemerintah\s+(?:desa|pekon|gampong|nagari|kelurahan)\s+([a-z\s]+)/i,
            /kantor\s+(?:desa|pekon|gampong|nagari|kelurahan)\s+([a-z\s]+)/i,
            /profil\s+(?:desa|pekon|gampong|nagari|kelurahan)\s+([a-z\s]+)/i,
            /(?:desa|pekon|gampong|nagari|kelurahan)\s+([a-z\s]+)\s*\|\s*/i
        ];

        for (const pattern of patterns) {
            const match = this.html.match(pattern);
            if (match) return match[1].trim();
        }

        const title = this.$('title').text();
        if (title) {
            // Look for "[Type] [Name]" in title
            const titleMatch = title.match(/(?:desa|pekon|gampong|nagari|kelurahan)\s+([a-z\s]+)/i);
            if (titleMatch) return this.cleanVillageName(titleMatch[1]);

            // Fallback: clean the whole title
            return this.cleanVillageName(title);
        }
        return null;
    }

    cleanVillageName(name) {
        if (!name) return null;
        return name.replace(/^(?:home\s*-\s*|pemerintah\s+|^|kantor\s+|profil\s+)(?:desa|pekon|gampong|nagari|kelurahan)\s+/i, '')
            .replace(/\s*[|,-].*$/, '') // Remove everything after | - or ,
            .replace(/\s+website\s+resmi\s*/i, '')
            .replace(/\s+official\s+website\s*/i, '')
            .trim();
    }

    extractKecamatan() {
        const patterns = [
            /kecamatan\s+([^,|<|\n]+?)(?=[,\s]+(?:kabupaten|kab\.|provinsi|prov\.)|$)/i,
            /kec\.\s+([^,|<|\n]+?)(?=[,\s]+(?:kabupaten|kab\.|provinsi|prov\.)|$)/i
        ];

        for (const pattern of patterns) {
            const match = this.html.match(pattern);
            if (match) return match[1].trim();
        }
        return null;
    }

    extractKabupaten() {
        const patterns = [
            /kabupaten\s+([^,|<|\n]+?)(?=[,\s]+(?:provinsi|prov\.|kecamatan|kec\.)|$)/i,
            /kab\.\s+([^,|<|\n]+?)(?=[,\s]+(?:provinsi|prov\.|kecamatan|kec\.)|$)/i
        ];

        for (const pattern of patterns) {
            const match = this.html.match(pattern);
            if (match) return match[1].trim();
        }
        return null;
    }

    extractProvinsi() {
        const patterns = [
            /provinsi\s+([^,|<|\n]+)/i,
            /prov\.\s+([^,|<|\n]+)/i
        ];

        for (const pattern of patterns) {
            const match = this.html.match(pattern);
            if (match) return match[1].trim().split(/[,\n]/)[0].trim();
        }
        return null;
    }

    extractKepalaDesa() {
        const patterns = [
            /kepala\s+desa[:\s]+([a-z\s\.]+)/i,
            /kades[:\s]+([a-z\s\.]+)/i,
            /bapak\s+([a-z\s\.]+)[,\s]*kepala\s+desa/i,
            /ibu\s+([a-z\s\.]+)[,\s]*kepala\s+desa/i
        ];

        for (const pattern of patterns) {
            const match = this.html.match(pattern);
            if (match) return match[1].trim();
        }
        return null;
    }

    extractKontak() {
        const phones = [];
        const patterns = [
            /(\+62[\s\d-]{8,15})/,
            /(0[8][\s\d-]{8,12})/,
            /(08\d{8,11})/,
            /telp[\.:]?\s*(\d[\d\s-]{6,})/i,
            /hp[\.:]?\s*(\d[\d\s-]{6,})/i,
            /wa[\.:]?\s*(\d[\d\s-]{6,})/i
        ];

        for (const pattern of patterns) {
            const matches = this.html.match(new RegExp(pattern, 'gi'));
            if (matches) phones.push(...matches);
        }
        return [...new Set(phones)].slice(0, 3);
    }

    extractEmail() {
        const pattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = this.html.match(pattern);
        return emails ? [...new Set(emails)].slice(0, 2) : [];
    }

    extractJumlahPenduduk() {
        const patterns = [
            /jumlah\s+penduduk[:\s]+(\d[\d\.,]*)/i,
            /penduduk[:\s]+(\d[\d\.,]*)\s*(jiwa|orang)/i,
            /total\s+penduduk[:\s]+(\d[\d\.,]*)/i
        ];

        for (const pattern of patterns) {
            const match = this.html.match(pattern);
            if (match) return match[1].replace(/[.,]/g, '');
        }
        return null;
    }

    extractAlamat() {
        const patterns = [
            /alamat\s+kantor\s+desa[:\s]+([^<]{10,100})/i,
            /alamat[:\s]+([^<]{10,100})/i,
            /lokasi\s+kantor[:\s]+([^<]{10,100})/i
        ];

        for (const pattern of patterns) {
            const match = this.html.match(pattern);
            if (match) return match[1].trim();
        }
        return null;
    }
}

module.exports = VillageExtractor;
