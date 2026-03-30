const fs = require('fs');
const path = require('path');

/**
 * Validate vehicles.meta XML structure and required fields.
 */
function checkVehiclesMeta(resourcePath, allFiles, result) {
    const metaFile = allFiles.find(f => path.basename(f).toLowerCase() === 'vehicles.meta');

    if (!metaFile) {
        result.errors.push({
            code: 'VEHICLES_META_MISSING',
            message: 'No vehicles.meta found — vehicle cannot spawn without it',
            fix: 'Add a vehicles.meta file with proper <Item> entries',
        });
        return;
    }

    result.stats.metaFiles++;
    let content;
    try {
        content = fs.readFileSync(metaFile, 'utf8');
    } catch (e) {
        result.errors.push({
            code: 'VEHICLES_META_UNREADABLE',
            message: `Cannot read vehicles.meta: ${e.message}`,
        });
        return;
    }

    // Basic XML check
    if (!content.includes('<?xml') && !content.includes('<CVehicleModelInfo__InitDataList')) {
        result.errors.push({
            code: 'VEHICLES_META_INVALID_XML',
            message: 'vehicles.meta does not appear to be valid XML',
            fix: 'Ensure the file starts with <?xml version="1.0"?> and has proper structure',
        });
        return;
    }

    // Check for required fields in each Item
    const items = content.match(/<Item[^>]*type="CVehicleModelInfo"[^>]*>[\s\S]*?<\/Item>/gi) || [];

    if (items.length === 0) {
        // Try alternative format
        const altItems = content.match(/<modelName>/gi);
        if (!altItems || altItems.length === 0) {
            result.errors.push({
                code: 'VEHICLES_META_NO_ITEMS',
                message: 'No vehicle entries found in vehicles.meta',
                fix: 'Add at least one <Item> with modelName, txdName, handlingId, gameName',
            });
            return;
        }
    }

    const requiredFields = ['modelName', 'txdName', 'handlingId', 'gameName'];
    const importantFields = ['vehicleMakeName', 'vehicleClass', 'type', 'audioNameHash'];

    // Extract modelNames
    const modelNames = [];
    const modelNameMatches = content.match(/<modelName>([^<]+)<\/modelName>/gi) || [];
    for (const match of modelNameMatches) {
        const name = match.replace(/<\/?modelName>/gi, '').trim();
        modelNames.push(name.toLowerCase());
    }

    // Check for duplicates
    const seen = new Set();
    for (const name of modelNames) {
        if (seen.has(name)) {
            result.errors.push({
                code: 'VEHICLES_META_DUPLICATE_MODEL',
                message: `Duplicate modelName: "${name}" — will cause spawn conflicts`,
                fix: `Rename one of the duplicate "${name}" entries to a unique name`,
            });
        }
        seen.add(name);
    }

    // Check required fields exist
    for (const field of requiredFields) {
        const regex = new RegExp(`<${field}>`, 'i');
        if (!regex.test(content)) {
            result.errors.push({
                code: 'VEHICLES_META_MISSING_FIELD',
                message: `Required field <${field}> not found in vehicles.meta`,
                fix: `Add <${field}> to each vehicle <Item> entry`,
            });
        }
    }

    // Check important fields
    for (const field of importantFields) {
        const regex = new RegExp(`<${field}>`, 'i');
        if (!regex.test(content)) {
            result.warnings.push({
                code: 'VEHICLES_META_MISSING_OPTIONAL',
                message: `Optional field <${field}> not found — vehicle may have default/broken behavior`,
                fix: `Consider adding <${field}> for better in-game behavior`,
            });
        }
    }

    // Check audioNameHash specifically
    const audioMatch = content.match(/<audioNameHash>([^<]*)<\/audioNameHash>/i);
    if (audioMatch) {
        const audioHash = audioMatch[1].trim();
        if (!audioHash || audioHash === '' || audioHash === '0') {
            result.warnings.push({
                code: 'VEHICLES_META_NO_AUDIO',
                message: 'audioNameHash is empty — vehicle will have no engine sound',
                fix: 'Set audioNameHash to a valid GTA V vehicle audio name (e.g., "adder", "zentorno")',
            });
        }
    }

    result.info.push({
        code: 'VEHICLES_META_OK',
        message: `vehicles.meta: ${modelNames.length} vehicle(s) defined — ${modelNames.join(', ') || 'none'}`,
    });
}

module.exports = { checkVehiclesMeta };
