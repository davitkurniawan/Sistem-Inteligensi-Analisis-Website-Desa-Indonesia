// Web Detector CMS - Backend Engine: Security Scanner
const axios = require('axios');
const https = require('https');

class SecurityScanner {
    constructor(url) {
        this.url = url;
        this.vulnerabilities = [];
        this.score = 100;
    }

    /*
     * Performs a comprehensive security scan
     */
    async fullScan() {
        const results = {
            ssl: await this.checkSSL(),
            headers: await this.checkSecurityHeaders(),
            backdoors: await this.checkBackdoors(),
            exposed_files: await this.checkExposedFiles(),
            score: this.score,
            risk_level: this.calculateRisk()
        };
        return results;
    }

    async checkSSL() {
        try {
            const agent = new https.Agent({ keepAlive: true });
            const res = await axios.get(this.url, {
                httpsAgent: agent,
                timeout: 5000,
                validateStatus: false
            });

            // Simple SSL check - in real node environment we'd use getPeerCertificate()
            // For simulator we mock success if https
            const isHttps = this.url.startsWith('https');
            if (!isHttps) {
                this.vulnerabilities.push({
                    type: 'ssl',
                    severity: 'high',
                    description: 'Website does not use HTTPS'
                });
                this.score -= 20;
                return { valid: false, error: 'Insecure Protocol' };
            }
            return { valid: true, version: 'TLS v1.3' };
        } catch (e) {
            return { valid: false, error: e.message };
        }
    }

    async checkSecurityHeaders() {
        try {
            const res = await axios.head(this.url, { timeout: 5000, validateStatus: false });
            const headers = res.headers;

            const missing = [];
            const criticalHeaders = {
                'strict-transport-security': 'HSTS missing',
                'x-frame-options': 'Clickjacking protection missing',
                'x-content-type-options': 'MIME sniffing protection missing',
                'content-security-policy': 'CSP missing'
            };

            for (const [key, desc] of Object.entries(criticalHeaders)) {
                if (!headers[key]) {
                    missing.push({ header: key, description: desc });
                    this.score -= 5;
                }
            }

            return { present: Object.keys(headers), missing };
        } catch (e) {
            return { error: e.message };
        }
    }

    async checkBackdoors() {
        const commonBackdoors = [
            '/shell.php', '/adminer.php', '/phpmyadmin/', '/.env', '/config.php.bak'
        ];
        const found = [];

        for (const path of commonBackdoors) {
            try {
                const testUrl = new URL(path, this.url).href;
                const res = await axios.head(testUrl, { timeout: 2000, validateStatus: false });
                if (res.status === 200) {
                    found.push(path);
                    this.score -= 30;
                }
            } catch (e) { }
        }
        return found;
    }

    async checkExposedFiles() {
        const sensitive = ['/.git/', '/database.sql', '/backup.zip'];
        const exposed = [];
        for (const file of sensitive) {
            try {
                const res = await axios.head(new URL(file, this.url).href, { timeout: 2000, validateStatus: false });
                if (res.status === 200) {
                    exposed.push(file);
                    this.score -= 15;
                }
            } catch (e) { }
        }
        return exposed;
    }

    calculateRisk() {
        if (this.score >= 80) return 'safe';
        if (this.score >= 60) return 'warning';
        if (this.score >= 40) return 'dangerous';
        return 'critical';
    }
}

module.exports = SecurityScanner;
