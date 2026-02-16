// Web Detector CMS - Backend Logic: Scan Queue
const CMSDetector = require('./engines/detector');
const VillageExtractor = require('./engines/extractor');
const SecurityScanner = require('./engines/security');

class ScanQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.results = [];
    }

    addToQueue(url, priority = 5) {
        this.queue.push({ url, priority, status: 'pending', addedAt: new Date() });
        this.queue.sort((a, b) => b.priority - a.priority);
        console.log(`[Queue] Added: ${url}`);
    }

    async processNext() {
        if (this.queue.length === 0 || this.isProcessing) return;

        this.isProcessing = true;
        const item = this.queue.shift();
        item.status = 'processing';
        console.log(`[Queue] Processing: ${item.url}`);

        try {
            const detector = new CMSDetector(item.url);
            const detection = await detector.detect();

            // In a real system, we'd save this to DB
            this.results.push({ url: item.url, result: detection, timestamp: new Date() });
            item.status = 'completed';
        } catch (e) {
            item.status = 'failed';
            item.error = e.message;
        }

        this.isProcessing = false;
        this.processNext(); // Process next in line
    }
}

module.exports = ScanQueue;
