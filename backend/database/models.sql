-- Web Detector CMS - Database Schema

-- 1. TABEL CMS_FINGERPRINTS (Database Sidik Jari CMS)
CREATE TABLE IF NOT EXISTS cms_fingerprints (
    id SERIAL PRIMARY KEY,
    cms_name VARCHAR(100) NOT NULL,
    cms_variant VARCHAR(100),
    version_pattern VARCHAR(255),
    detection_type VARCHAR(50), -- header, body, meta, url_pattern
    pattern TEXT NOT NULL,
    confidence_score INTEGER DEFAULT 80,
    category VARCHAR(50), -- OpenSource, Commercial, Custom
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL DETECTED_WEBSITES (Hasil Deteksi Website)
CREATE TABLE IF NOT EXISTS detected_websites (
    id SERIAL PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    full_url TEXT,
    domain VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255),
    ip_address INET,
    ip_geolocation JSONB,
    
    -- CMS Info
    cms_id INTEGER REFERENCES cms_fingerprints(id),
    cms_name VARCHAR(100),
    cms_version VARCHAR(50),
    cms_confidence INTEGER,
    
    -- Security Assessment
    security_score INTEGER,
    security_status VARCHAR(20), -- safe, warning, dangerous, critical
    vulnerabilities JSONB,
    has_backdoor BOOLEAN DEFAULT FALSE,
    ssl_valid BOOLEAN,
    ssl_expiry DATE,
    
    -- Extracted Info (Village metadata)
    extracted_data JSONB, -- {nama_desa, email, telepon, alamat, kades}
    
    status VARCHAR(20) DEFAULT 'active',
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_count INTEGER DEFAULT 1,
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL WILAYAH_INTEGRATION (Integrasi Manual/Fuzzy ke Kemendagri)
CREATE TABLE IF NOT EXISTS wilayah_integrations (
    id SERIAL PRIMARY KEY,
    website_id INTEGER REFERENCES detected_websites(id),
    kode_provinsi VARCHAR(2),
    kode_kabupaten VARCHAR(4),
    kode_kecamatan VARCHAR(6),
    kode_desa VARCHAR(10),
    nama_provinsi VARCHAR(100),
    nama_kabupaten VARCHAR(100),
    nama_kecamatan VARCHAR(100),
    nama_desa VARCHAR(100),
    match_confidence INTEGER,
    match_method VARCHAR(50), -- exact, fuzzy, manual
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL SECURITY_LOGS (Detil Temuan Keamanan)
CREATE TABLE IF NOT EXISTS security_logs (
    id SERIAL PRIMARY KEY,
    website_id INTEGER REFERENCES detected_websites(id),
    scan_type VARCHAR(50), -- xss, sqli, backdoor, ssl
    severity VARCHAR(20),
    finding TEXT,
    evidence TEXT,
    recommendation TEXT,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABEL SCAN_QUEUES (Manajemen Antrian)
CREATE TABLE IF NOT EXISTS scan_queues (
    id SERIAL PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    priority INTEGER DEFAULT 5,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);
