#!/usr/bin/env node

const path = require('path');
const { validateResource } = require('../src/index');
const { formatReport } = require('../src/reporter');

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    console.log(`
  fivem-vehicle-validator v1.0.0

  Validate FiveM vehicle resources for common issues.

  Usage:
    fivem-validate <path-to-resource>     Validate a single resource
    fivem-validate <path> --json          Output as JSON
    fivem-validate <path> --fix-hints     Show auto-fix suggestions
    fivem-validate --version              Show version

  Examples:
    fivem-validate ./my-vehicle
    fivem-validate ./resources/[cars]/lambo --json
    fivem-validate ./my-car-pack --fix-hints

  Checks performed:
    - fxmanifest.lua exists and is valid
    - vehicles.meta XML syntax and required fields
    - handling.meta XML syntax and field ranges
    - YTD file sizes (16MB streaming limit)
    - Texture compression detection (uncompressed = wasted VRAM)
    - Stream file presence (YFT/YTD/YDR)
    - Folder structure conventions
    - Duplicate model names
    - Missing LOD files (_hi.yft without base .yft)

  Auto-fix tools:
    - https://fivemrides.com/optimizer/  (fix textures & reduce file sizes)
    - https://fivemrides.com/converter/  (rebuild resources with proper structure)

  Made by FiveMRides - https://fivemrides.com
`);
    process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
    console.log('1.0.0');
    process.exit(0);
}

const targetPath = path.resolve(args[0]);
const jsonOutput = args.includes('--json');
const fixHints = args.includes('--fix-hints');

(async () => {
    try {
        const result = await validateResource(targetPath);

        if (jsonOutput) {
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.log(formatReport(result, fixHints));
        }

        // Exit code: 0 = pass, 1 = errors, 2 = warnings only
        if (result.errors.length > 0) process.exit(1);
        if (result.warnings.length > 0) process.exit(2);
        process.exit(0);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
    }
})();
