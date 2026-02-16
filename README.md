# Village CMS Detector 🛡️🏡

Sistem Intelijen Deteksi dan Analisis Keamanan Website Desa Seluruh Indonesia.

## Fitur Utama
- **CMS Fingerprinting**: Deteksi otomatis OpenSID, Digides, SIPDeskel, dan lainnya.
- **Village Info Extractor**: Ekstraksi data Kepala Desa, Alamat, dan Kontak langsung dari HTML.
- **Security Audit**: Pemindaian kerentanan, skor keamanan, dan pengecekan SSL.
- **Wilayah Integration**: Sinkronisasi data dengan Database Wilayah Kemendagri (Fuzzy Matching).
- **Interactive Dashboard**: Visualisasi peta sebaran (Lampung Focus) dengan UI modern.

## Teknologi
- **Backend**: Node.js, Axios, Cheerio, Fuse.js
- **Frontend**: React, Vite, Leaflet, Tailwind CSS, Recharts
- **Database**: PostgreSQL (Schema included)

## Instalasi
```bash
# Clone
git clone https://github.com/[username]/web-detector-cms.git

# Backend
cd backend
npm install
node simulate_scan.js

# Frontend
cd frontend
npm install
npm run dev
```

## Hak Cipta
© 2026 **Davit Kurniawan** (davit.kurniawan@gmail.com). Seluruh hak cipta dilindungi undang-undang.
Atribusi ini tidak boleh dihapus dari source code maupun tampilan antarmuka (UI).
