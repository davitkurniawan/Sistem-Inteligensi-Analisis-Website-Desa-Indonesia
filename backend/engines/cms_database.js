// Web Detector CMS - Fingerprint Database
// Patterns based on common Indonesian Village CMS

const CMS_DATABASE = [
    {
        name: "OpenSID",
        variants: ["Umum", "Premium"],
        fingerprints: {
            headers: ["X-OpenSID", "OpenSID"],
            meta: [{ name: "generator", content: "OpenSID" }],
            body_patterns: [
                /class="opensid"/i,
                /id="opensid"/i,
                /\/assets\/opensid\//i,
                /\/themes\/opensid\//i,
                /sid304/i, 
                /siteman/i,
                /OpenSID\s+v?[\d.]+/i,
                /opendesa\.id/i
            ],
            url_patterns: [
                "/index.php/siteman",
                "/siteman",
                "/first",
                "/desa",
                "/assets/opensid/"
            ],
            version_detection: /OpenSID\s+v?([\d.]+)/i
        },
        confidence: 95,
        category: "OpenSource"
    },
    {
        name: "SIPDeskel",
        variants: ["Terpadu"],
        fingerprints: {
            headers: ["SIPDeskel", "X-SIPDeskel"],
            body_patterns: [
                /sipdeskel/i,
                /sistem informasi pemerintahan desa kelurahan/i,
                /sipdeskel\.desa\.id/i,
                /sso\.sipdeskel\.id/i,
                /presensia\.sipdeskel\.id/i,
                /copyright.*sipdeskel/i,
                /kebijakan privasi.*sipdeskel/i,
                /sipdeskel\s+©\s+20\d{2}/i,
                /powered\s+by\s+sipdeskel/i,
                /v\d{2}\.\d{2}\.\d+\.\d+/ // SIPDeskel version format like V24.12.1.1
            ],
            url_patterns: [
                "/home/home.aspx",
                "/pages/monograph/monograph-village-profile.aspx",
                "/articles/artikel.aspx",
                "/sipdeskel/",
                "/admin-sipdeskel/"
            ]
        },
        confidence: 98,
        category: "Commercial"
    },
    {
        name: "Digides",
        variants: ["Digital Desa", "Digides.id"],
        fingerprints: {
            headers: ["X-Digides", "Digital-Desa"],
            body_patterns: [
                /digides/i,
                /digitaldesa\.id/i,
                /digital desa indonesia/i,
                /pt digital desa indonesia/i,
                /copyright.*digital desa/i
            ],
            url_patterns: ["/digides/", "/digitaldesa/", "/api/digides/"]
        },
        confidence: 94,
        category: "Commercial"
    },
    {
        name: "Metadesa",
        variants: ["Smart Village"],
        fingerprints: {
            body_patterns: [
                /metadesa/i,
                /it provinsi lampung/i,
                /smart village lampung/i,
                /metamart/i,
                /geometa/i
            ],
            url_patterns: ["/metadesa/", "/smartvillage/", "/menu/metamart.aspx"]
        },
        confidence: 92,
        category: "Government"
    },
    {
        name: "WordPress-Desa",
        variants: ["Custom Theme"],
        fingerprints: {
            meta: [{ name: "generator", content: "WordPress" }],
            body_patterns: [
                /wp-content\/themes\/desa/i,
                /wp-content\/plugins\/desa/i,
                /themes\/desa\//i
            ],
            url_patterns: ["/wp-admin/", "/wp-content/"]
        },
        confidence: 70,
        category: "Custom"
    }
];

module.exports = { CMS_DATABASE };
