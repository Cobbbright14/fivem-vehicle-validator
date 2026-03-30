const path = require('path');
const fs = require('fs');
const { validateResource } = require('../src/index');
const { formatReport } = require('../src/reporter');

// Create test fixtures
const fixturesDir = path.join(__dirname, 'fixtures');

function setup() {
    // Good resource
    const good = path.join(fixturesDir, 'good-vehicle');
    fs.mkdirSync(path.join(good, 'stream'), { recursive: true });
    fs.mkdirSync(path.join(good, 'data'), { recursive: true });

    fs.writeFileSync(path.join(good, 'fxmanifest.lua'), `
fx_version 'cerulean'
game 'gta5'
author 'Test'
files {
    'data/vehicles.meta',
    'data/handling.meta',
}
data_file 'VEHICLE_METADATA_FILE' 'data/vehicles.meta'
data_file 'HANDLING_FILE' 'data/handling.meta'
`);

    fs.writeFileSync(path.join(good, 'data', 'vehicles.meta'), `<?xml version="1.0" encoding="UTF-8"?>
<CVehicleModelInfo__InitDataList>
  <InitDatas>
    <Item type="CVehicleModelInfo">
      <modelName>testcar</modelName>
      <txdName>testcar</txdName>
      <handlingId>TESTCAR</handlingId>
      <gameName>testcar</gameName>
      <vehicleMakeName>TEST</vehicleMakeName>
      <vehicleClass>VehicleClass_Sport</vehicleClass>
      <type>AUTOMOBILE</type>
      <audioNameHash>zentorno</audioNameHash>
    </Item>
  </InitDatas>
</CVehicleModelInfo__InitDataList>`);

    fs.writeFileSync(path.join(good, 'data', 'handling.meta'), `<?xml version="1.0" encoding="UTF-8"?>
<CHandlingDataMgr>
  <HandlingData>
    <Item type="CHandlingData">
      <handlingName>TESTCAR</handlingName>
      <fMass value="1500.000000" />
      <fInitialDragCoeff value="8.500000" />
      <fBrakeForce value="0.800000" />
      <nInitialDriveGears value="6" />
    </Item>
  </HandlingData>
</CHandlingDataMgr>`);

    // Create fake YTD/YFT (small files for testing)
    fs.writeFileSync(path.join(good, 'stream', 'testcar.ytd'), Buffer.alloc(1024 * 100)); // 100KB
    fs.writeFileSync(path.join(good, 'stream', 'testcar.yft'), Buffer.alloc(1024 * 200)); // 200KB
    fs.writeFileSync(path.join(good, 'stream', 'testcar_hi.yft'), Buffer.alloc(1024 * 300)); // 300KB

    // Bad resource (missing stuff)
    const bad = path.join(fixturesDir, 'bad-vehicle');
    fs.mkdirSync(bad, { recursive: true });
    fs.writeFileSync(path.join(bad, 'readme.txt'), 'This is not a valid resource');

    return { good, bad };
}

async function runTests() {
    console.log('\n  Running tests...\n');
    const { good, bad } = setup();
    let passed = 0;
    let failed = 0;

    // Test 1: Good resource should pass
    const goodResult = await validateResource(good);
    if (goodResult.passed && goodResult.errors.length === 0) {
        console.log('  \u2713 Good resource passes validation');
        passed++;
    } else {
        console.log('  \u2718 Good resource should pass but got errors:');
        goodResult.errors.forEach(e => console.log(`    - ${e.message}`));
        failed++;
    }

    // Test 2: Bad resource should fail
    const badResult = await validateResource(bad);
    if (!badResult.passed && badResult.errors.length > 0) {
        console.log('  \u2713 Bad resource fails validation');
        passed++;
    } else {
        console.log('  \u2718 Bad resource should fail');
        failed++;
    }

    // Test 3: Report formatting
    const report = formatReport(goodResult, true);
    if (report.includes('PASSED') && report.includes('testcar')) {
        console.log('  \u2713 Report formatting works');
        passed++;
    } else {
        console.log('  \u2718 Report formatting broken');
        failed++;
    }

    // Test 4: JSON output
    const json = JSON.stringify(goodResult);
    if (json.includes('"passed":true') && json.includes('"errors":[]')) {
        console.log('  \u2713 JSON output works');
        passed++;
    } else {
        console.log('  \u2718 JSON output broken');
        failed++;
    }

    // Print sample report
    console.log('\n  Sample report (good resource):');
    console.log(formatReport(goodResult, true));

    console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);

    // Cleanup
    fs.rmSync(fixturesDir, { recursive: true, force: true });

    process.exit(failed > 0 ? 1 : 0);
}

runTests();
