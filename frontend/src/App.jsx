import React, { useState, useEffect, useRef } from 'react';

function App() {
    const [url, setUrl] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [loadingText, setLoadingText] = useState('Memulai analisis...');
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState(null);
    const mapRef = useRef(null);
    const currentMarkerRef = useRef(null);

    useEffect(() => {
        // Initialize Leaflet Map
        if (window.L && !mapRef.current) {
            const L = window.L;
            mapRef.current = L.map('map', {
                zoomControl: false,
                attributionControl: false
            }).setView([-4.85, 105.0], 8); // Lampung Focus

            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(mapRef.current);

            L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

            // Add Lampung Sample Markers
            addSampleMarkers(L);
        }

        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                resetSearch();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const resetSearch = () => {
        setShowResults(false);
        setResults(null);
        setIsScanning(false);
        setUrl('');
        if (mapRef.current) {
            mapRef.current.flyTo([-4.85, 105.0], 8, { duration: 1.5 });
            if (currentMarkerRef.current) {
                mapRef.current.removeLayer(currentMarkerRef.current);
                currentMarkerRef.current = null;
            }
        }
    };

    const addSampleMarkers = (L) => {
        const sampleLocations = [
            { lat: -5.4297, lng: 105.2619, name: "Desa Pahoman", status: "safe" },
            { lat: -5.3852, lng: 105.2974, name: "Desa Sukarame", status: "safe" },
            { lat: -5.4678, lng: 105.2155, name: "Desa Panjang", status: "warning" },
            { lat: -4.9542, lng: 105.1235, name: "Desa Gunung Batin", status: "safe" },
            { lat: -4.4532, lng: 105.0123, name: "Desa Menggala", status: "dangerous" }
        ];

        sampleLocations.forEach(loc => {
            const color = loc.status === 'safe' ? '#10b981' :
                loc.status === 'warning' ? '#f59e0b' : '#ef4444';

            L.circleMarker([loc.lat, loc.lng], {
                radius: 6,
                fillColor: color,
                color: color,
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.4
            }).addTo(mapRef.current).bindPopup(`
        <div style="font-family: Inter, sans-serif; font-size: 12px; color: #000;">
          <strong>${loc.name}</strong><br>
          <span style="color: ${color};">● ${loc.status.toUpperCase()}</span>
        </div>
      `);
        });
    };

    const startDetection = async () => {
        if (!url) return;

        setIsScanning(true);
        setShowResults(false);

        const steps = [
            "Resolving DNS...",
            "Analyzing IP geolocation...",
            "Detecting CMS platform...",
            "Scanning security vulnerabilities...",
            "Extracting public information...",
            "Matching with Kemendagri database...",
            "Finalizing report..."
        ];

        for (const step of steps) {
            setLoadingText(step);
            await new Promise(r => setTimeout(r, 600));
        }

        const mockResults = generateMockResults(url);
        setResults(mockResults);
        setIsScanning(false);
        setShowResults(true);

        // Update Map
        if (mapRef.current && window.L) {
            const L = window.L;
            if (currentMarkerRef.current) mapRef.current.removeLayer(currentMarkerRef.current);

            mapRef.current.flyTo([mockResults.wilayah.lat, mockResults.wilayah.lng], 14, { duration: 2 });

            const iconHtml = `
            <div class="relative">
                <div class="marker-pulse absolute inset-0 bg-emerald-500 rounded-full opacity-75"></div>
                <div class="relative w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full border-2 border-white shadow-2xl flex items-center justify-center">
                    <i class="fas fa-home text-white text-lg"></i>
                </div>
            </div>
        `;

            const customIcon = L.divIcon({
                html: iconHtml,
                className: 'custom-marker',
                iconSize: [48, 48],
                iconAnchor: [24, 24]
            });

            const statusColor = mockResults.security.status === 'safe' ? '#10b981' : '#f59e0b';
            const popupHtml = `
                <div style="font-family: 'Inter', sans-serif; padding: 5px; min-width: 180px;">
                    <h4 style="margin: 0 0 5px 0; color: #1e293b; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">${mockResults.wilayah.nama_desa}</h4>
                    <div style="font-size: 11px; color: #64748b; line-height: 1.4;">
                        <p style="margin: 2px 0;"><strong>Kecamatan:</strong> ${mockResults.wilayah.kecamatan}</p>
                        <p style="margin: 2px 0;"><strong>Kabupaten:</strong> ${mockResults.wilayah.kabupaten}</p>
                        <p style="margin: 8px 0 0 0; display: flex; align-items: center; gap: 4px;">
                            <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${statusColor};"></span>
                            <strong style="color: ${statusColor}; text-transform: uppercase;">STATUS: ${mockResults.security.status}</strong>
                        </p>
                    </div>
                </div>
            `;

            currentMarkerRef.current = L.marker([mockResults.wilayah.lat, mockResults.wilayah.lng], {
                icon: customIcon
            }).addTo(mapRef.current)
                .bindPopup(popupHtml, { closeButton: false, offset: [0, -10] })
                .openPopup();
        }
    };

    const generateMockResults = (inputUrl) => {
        const domain = inputUrl.replace('https://', '').replace('http://', '').split('/')[0];
        const sub = domain.split('.')[0].toLowerCase();

        let villagePart = sub;
        let kabHint = null;
        if (sub.includes('-')) {
            const parts = sub.split('-');
            villagePart = parts[0];
            kabHint = parts[1];
        }

        const rawName = villagePart.charAt(0).toUpperCase() + villagePart.slice(1);
        const villageName = `Desa ${rawName}`;

        // Coordinate Mapping for Lampung Villages (Simulated Database)
        const locationMap = {
            'bumidaya': { lat: -5.7329, lng: 105.5908, kec: 'Kecamatan Palas', kab: 'Kabupaten Lampung Selatan' },
            'tulusrejo': { lat: -5.0234, lng: 105.2123, kec: 'Kecamatan Pekalongan', kab: 'Kabupaten Lampung Timur' },
            'sukarame': { lat: -5.3852, lng: 105.2974, kec: 'Kecamatan Sukarame', kab: 'Kota Bandar Lampung' },
            'pahoman': { lat: -5.4297, lng: 105.2619, kec: 'Kecamatan Enggal', kab: 'Kota Bandar Lampung' },
            'madaraya': { lat: -5.2034, lng: 104.9123, kec: 'Kecamatan Pagelaran Utara', kab: 'Kabupaten Pringsewu' },
            'sukoharjo': { lat: -5.2542, lng: 104.9876, kec: 'Kecamatan Sukoharjo', kab: 'Kabupaten Pringsewu' }
        };

        const loc = locationMap[villagePart] || {
            lat: kabHint === 'pringsewu' ? -5.2 + (Math.random() - 0.5) * 0.2 : -5.0 + (Math.random() - 0.5) * 1.5,
            lng: kabHint === 'pringsewu' ? 104.9 + (Math.random() - 0.5) * 0.2 : 105.2 + (Math.random() - 0.5) * 1.5,
            kec: kabHint === 'pringsewu' ? 'Kecamatan di Pringsewu' : 'Kecamatan Terdeteksi',
            kab: kabHint === 'pringsewu' ? 'Kabupaten Pringsewu' : 'Kabupaten Lampung (Simulasi)'
        };

        // CMS Logic
        let cmsName = 'OpenSID Premium';
        if (sub.includes('pringsewu') || sub.includes('tulusrejo') || sub.includes('bumidaya')) {
            cmsName = 'SIPDeskel';
        }

        return {
            url: inputUrl,
            domain: domain,
            ip: `103.129.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            timestamp: new Date().toLocaleString('id-ID'),
            wilayah: {
                nama_desa: villageName,
                kecamatan: loc.kec,
                kabupaten: loc.kab,
                provinsi: 'Lampung',
                lat: loc.lat,
                lng: loc.lng
            },
            cms: {
                name: cmsName,
                version: cmsName === 'SIPDeskel' ? '2.4.0' : '24.01-LTS',
                confidence: 96,
                category: 'Government'
            },
            security: {
                score: 88,
                status: 'safe',
                vulnerabilities: []
            },
            extracted: {
                kepala_desa: 'Bapak ' + ['Sutrisno', 'Budianto', 'Maryanto', 'Hasan'][Math.floor(Math.random() * 4)],
                telepon: '0812-77xx-xxxx',
                email: `admin@${domain}`,
                jumlah_penduduk: (4000 + Math.floor(Math.random() * 3000)) + ' jiwa'
            }
        };
    };

    return (
        <div className="relative z-20 min-h-screen flex flex-col">
            <div id="map"></div>
            <div className="grid-overlay"></div>

            {/* Header */}
            <header className="glass border-b border-slate-700/50 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <i className="fas fa-satellite-dish text-white text-lg"></i>
                    </div>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">CMS Desa Detector</h1>
                        <p className="text-xs text-slate-400">Sistem Inteligensi Analisis Website Desa Indonesia</p>
                    </div>
                </div>
                {showResults && (
                    <button
                        onClick={resetSearch}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-slate-700 transition-all text-sm text-slate-300"
                    >
                        <kbd className="px-1.5 py-0.5 rounded bg-slate-700 text-[10px] font-mono border border-slate-600">ESC</kbd>
                        <span>Kembali Cari</span>
                    </button>
                )}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-slate-300">Database: <span className="text-emerald-400 font-mono">74,986</span> Desa</span>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center p-6 relative">
                {/* Input Dialog - Hidden when results are shown */}
                {!showResults && (
                    <div
                        id="inputDialog"
                        className={`glass rounded-2xl p-8 max-w-2xl w-full shadow-2xl shadow-black/50 transform transition-all duration-500 ${isScanning ? 'scanning opacity-50' : 'opacity-100 scale-100'}`}
                    >
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 mb-4">
                                <i className="fas fa-search-location text-3xl text-emerald-400"></i>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Deteksi Website Desa</h2>
                            <p className="text-slate-400 text-sm">Masukkan URL domain website desa untuk analisis mendalam</p>
                        </div>

                        <div className="relative mb-6">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <i className="fas fa-globe text-slate-500"></i>
                            </div>
                            <input
                                type="text"
                                className="w-full pl-11 pr-32 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none input-glow transition-all mono text-sm"
                                placeholder="https://desacontoh.desa.id"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && startDetection()}
                            />
                            <div className="absolute inset-y-0 right-2 flex items-center">
                                <button
                                    onClick={startDetection}
                                    disabled={isScanning}
                                    className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/25 flex items-center gap-2"
                                >
                                    {isScanning ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-radar"></i>}
                                    <span>{isScanning ? 'Scanning...' : 'Detect'}</span>
                                </button>
                            </div>
                            {isScanning && <div className="scan-line"></div>}
                        </div>

                        {isScanning && (
                            <div className="mt-6 text-center">
                                <div className="flex items-center justify-center gap-3 text-emerald-400">
                                    <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                                    <span className="text-sm font-medium typing">{loadingText}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {results && (
                    <div id="resultsPanel" className={`result-card fixed right-0 top-16 bottom-0 w-full md:w-[480px] glass border-l border-slate-700/50 overflow-y-auto z-30 ${showResults ? 'show' : ''}`}>
                        <div className="sticky top-0 glass border-b border-slate-700/50 p-6 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-lg">Hasil Deteksi</h3>
                                <p className="text-xs text-slate-400 mt-1">{results.timestamp}</p>
                            </div>
                            <button onClick={() => setShowResults(false)} className="w-8 h-8 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 flex items-center justify-center transition-colors">
                                <i className="fas fa-times text-slate-400"></i>
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-emerald-500/20 text-emerald-400`}>
                                    <i className="fas fa-shield-alt"></i>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 rounded text-xs font-medium badge-safe">AMAN</span>
                                        <span className="text-xs text-slate-500">•</span>
                                        <span className="text-xs text-emerald-400 font-medium">{results.cms.name}</span>
                                    </div>
                                    <p className="text-sm text-slate-300">Website desa teridentifikasi aman dengan proteksi standar</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-600/10 border border-emerald-500/20">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <i className="fas fa-map-marker-alt text-emerald-400"></i>
                                    </div>
                                    <div className="flex-1">
                                        <h5 className="font-semibold text-emerald-100 mb-1">{results.wilayah.nama_desa}</h5>
                                        <p className="text-sm text-emerald-200/70 leading-relaxed">{results.wilayah.kecamatan}, {results.wilayah.kabupaten}, {results.wilayah.provinsi}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                                    <p className="text-xs text-slate-500 mb-1">IP Address</p>
                                    <p className="text-sm font-medium text-emerald-400">{results.ip}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/30 border border-slate-700/30">
                                    <p className="text-xs text-slate-500 mb-1">Versi CMS</p>
                                    <p className="text-sm font-medium text-white">{results.cms.version}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="glass border-t border-slate-700/50 px-6 py-3 flex items-center justify-between text-xs z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <i className="fas fa-check-circle text-emerald-400"></i>
                        <span className="text-slate-400">Website Terdeteksi: <span className="text-white font-mono">1,247</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <i className="fas fa-shield-alt text-emerald-400"></i>
                        <span className="text-slate-400">Status Aman: <span className="text-emerald-400 font-mono">892</span></span>
                    </div>
                </div>

                {/* Persistent Branding */}
                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                    <span className="text-slate-500">© {new Date().getFullYear()} CMS Desa Detector • </span>
                    <span className="text-emerald-400 font-medium">
                        {atob('Y29weXJpZ2h0IGJ5IA==')}{/* "copyright by " */}
                        {atob('ZGF2aXQua3Vybmlhd2FuQGdtYWlsLmNvbQ==')/* "davit.kurniawan@gmail.com" */}
                    </span>
                </div>

                <div className="flex items-center gap-2 text-slate-500">
                    <i className="fas fa-code-branch"></i>
                    <span>v2.4.0</span>
                </div>
            </footer>
        </div>
    );
}

export default App;
