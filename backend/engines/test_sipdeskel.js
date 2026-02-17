const CMSDetector = require('./detector');

async function testDetection() {
    const url = 'https://tulusrejo.desa.id';
    console.log(`Testing CMS Detection for: ${url}`);

    const detector = new CMSDetector(url);
    const results = await detector.detect();

    console.log('\n--- Detection Results ---');
    console.log(JSON.stringify(results, null, 2));

    if (results.primary_cms && results.primary_cms.name === 'SIPDeskel') {
        console.log('\n✅ SUCCESS: SIPDeskel correctly detected!');
    } else {
        console.log('\n❌ FAILURE: SIPDeskel not detected as primary CMS.');
    }
}

testDetection();
