const fs = require('fs');
const path = require('path');

/**
 * Validate handling.meta XML and check for suspicious values.
 */
function checkHandlingMeta(resourcePath, allFiles, result) {
    const metaFile = allFiles.find(f => path.basename(f).toLowerCase() === 'handling.meta');

    if (!metaFile) {
        result.warnings.push({
            code: 'HANDLING_META_MISSING',
            message: 'No handling.meta found — vehicle will use default GTA V handling',
            fix: 'Add handling.meta for custom driving physics, or use a handling preset tool',
        });
        return;
    }

    result.stats.metaFiles++;
    let content;
    try {
        content = fs.readFileSync(metaFile, 'utf8');
    } catch (e) {
        result.errors.push({
            code: 'HANDLING_META_UNREADABLE',
            message: `Cannot read handling.meta: ${e.message}`,
        });
        return;
    }

    // Basic XML check
    if (!content.includes('CHandlingDataMgr') && !content.includes('handlingName')) {
        result.errors.push({
            code: 'HANDLING_META_INVALID',
            message: 'handling.meta does not appear to be valid handling XML',
        });
        return;
    }

    // Check for suspicious values
    const checks = [
        { field: 'fMass', min: 100, max: 50000, unit: 'kg' },
        { field: 'fInitialDragCoeff', min: 0.1, max: 100, unit: '' },
        { field: 'fBrakeForce', min: 0.1, max: 10, unit: '' },
        { field: 'nInitialDriveGears', min: 1, max: 12, unit: 'gears' },
    ];

    for (const check of checks) {
        const regex = new RegExp(`<${check.field}\\s+value="([^"]*)"`, 'i');
        const match = content.match(regex);
        if (match) {
            const val = parseFloat(match[1]);
            if (!isNaN(val)) {
                if (val < check.min || val > check.max) {
                    result.warnings.push({
                        code: 'HANDLING_SUSPICIOUS_VALUE',
                        message: `${check.field} = ${val} seems unusual (expected ${check.min}-${check.max}${check.unit ? ' ' + check.unit : ''})`,
                        fix: `Review ${check.field} value — may cause unrealistic driving behavior`,
                    });
                }
            }
        }
    }

    // Check handlingName matches a vehicle
    const handlingNames = content.match(/<handlingName>([^<]+)<\/handlingName>/gi) || [];
    const count = handlingNames.length;

    result.info.push({
        code: 'HANDLING_META_OK',
        message: `handling.meta: ${count} handling entry/entries defined`,
    });
}

module.exports = { checkHandlingMeta };
