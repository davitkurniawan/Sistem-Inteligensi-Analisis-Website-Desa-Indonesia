// Web Detector CMS - Backend Engine: Detector
const axios = require('axios');
const cheerio = require('cheerio');
const { CMS_DATABASE } = require('./cms_database');

class CMSDetector {
    constructor(url) {
        this.url = url.startsWith('http') ? url : `http://${url}`;
        this.results = {
            url_scanned: this.url,
            status_code: null,
            cms_detected: [],
            confidence: 0,
            primary_cms: null
        };
    }

    async detect() {
        try {
            const response = await axios.get(this.url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Village-CMS-Detector/1.0'
                },
                validateStatus: false,
                maxRedirects: 5
            });

            this.results.final_url = response.request.res.responseUrl || this.url;
            this.results.status_code = response.status;
            const body = response.data;
            const headers = response.headers;
            const $ = cheerio.load(body);

            // 1. Check Headers
            this.checkHeaders(headers);

            // 2. Check Meta Tags
            this.checkMetaTags($);

            // 3. Check Body Patterns
            this.checkBody(body);

            // 4. Check Specific Paths (Optional/Heuristic)
            await this.checkPaths();

            // Finalize results
            if (this.results.cms_detected.length > 0) {
                // Sort by confidence
                this.results.cms_detected.sort((a, b) => b.confidence - a.confidence);
                this.results.primary_cms = this.results.cms_detected[0];
                this.results.confidence = this.results.primary_cms.confidence;
            }

            return this.results;
        } catch (error) {
            console.error(`Error scanning ${this.url}:`, error.message);
            return { ...this.results, error: error.message };
        }
    }

    checkHeaders(headers) {
        const headerStr = JSON.stringify(headers).toLowerCase();
        CMS_DATABASE.forEach(cms => {
            if (cms.fingerprints.headers) {
                cms.fingerprints.headers.forEach(pattern => {
                    if (headerStr.includes(pattern.toLowerCase())) {
                        this.addMatch(cms, 'header', pattern);
                    }
                });
            }
        });
    }

    checkMetaTags($) {
        const metaGenerator = $('meta[name="generator"]').attr('content');
        if (metaGenerator) {
            CMS_DATABASE.forEach(cms => {
                if (cms.fingerprints.meta) {
                    cms.fingerprints.meta.forEach(m => {
                        if (metaGenerator.toLowerCase().includes(m.content.toLowerCase())) {
                            this.addMatch(cms, 'meta_tag', metaGenerator);
                        }
                    });
                }
            });
        }
    }

    checkBody(html) {
        CMS_DATABASE.forEach(cms => {
            if (cms.fingerprints.body_patterns) {
                cms.fingerprints.body_patterns.forEach(pattern => {
                    if (pattern.test(html)) {
                        // Check version if pattern matches
                        let version = null;
                        if (cms.fingerprints.version_detection) {
                            const versionMatch = html.match(cms.fingerprints.version_detection);
                            if (versionMatch) version = versionMatch[1];
                        }
                        this.addMatch(cms, 'body_pattern', pattern.toString(), version);
                    }
                });
            }
        });
    }

    async checkPaths() {
        // Heuristic checking for common paths
        for (const cms of CMS_DATABASE) {
            if (cms.fingerprints.url_patterns) {
                for (const path of cms.fingerprints.url_patterns.slice(0, 2)) { // Only head first 2 for speed
                    try {
                        const testUrl = new URL(path, this.results.final_url || this.url).href;
                        const res = await axios.head(testUrl, { timeout: 3000, validateStatus: false });
                        if (res.status === 200 || res.status === 403) {
                            this.addMatch(cms, 'path_discovery', testUrl);
                            break; // One path match is enough
                        }
                    } catch (e) { }
                }
            }
        }
    }

    addMatch(cms, method, evidence, version = null) {
        const exists = this.results.cms_detected.find(d => d.name === cms.name);
        if (!exists) {
            this.results.cms_detected.push({
                name: cms.name,
                variant: cms.variants[0],
                version: version,
                confidence: cms.confidence,
                methods: [method],
                evidence: [evidence]
            });
        } else {
            if (!exists.methods.includes(method)) {
                exists.methods.push(method);
                exists.evidence.push(evidence);
                // Bonus confidence for multiple methods
                exists.confidence = Math.min(100, exists.confidence + 5);
            }
            if (version && !exists.version) exists.version = version;
        }
    }
}

module.exports = CMSDetector;
