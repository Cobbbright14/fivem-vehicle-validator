const fs = require('fs');
const path = require('path');

/**
 * Check fxmanifest.lua (or __resource.lua) for correctness.
 */
function checkManifest(resourcePath, allFiles, result) {
    const manifestPath = path.join(resourcePath, 'fxmanifest.lua');
    const legacyPath = path.join(resourcePath, '__resource.lua');

    const hasManifest = fs.existsSync(manifestPath);
    const hasLegacy = fs.existsSync(legacyPath);

    if (!hasManifest && !hasLegacy) {
        result.errors.push({
            code: 'MANIFEST_MISSING',
            message: 'No fxmanifest.lua or __resource.lua found',
            fix: 'Create a fxmanifest.lua with fx_version, game, files{}, and data_file entries',
        });
        return;
    }

    if (hasLegacy && !hasManifest) {
        result.warnings.push({
            code: 'MANIFEST_LEGACY',
            message: '__resource.lua is deprecated — migrate to fxmanifest.lua',
            fix: 'Rename __resource.lua to fxmanifest.lua and add fx_version/game declarations',
        });
    }

    const filePath = hasManifest ? manifestPath : legacyPath;
    const content = fs.readFileSync(filePath, 'utf8');

    // Check fx_version
    if (hasManifest && !content.match(/fx_version\s+['"](?:cerulean|bodacious|adamant)['"]/)) {
        result.warnings.push({
            code: 'MANIFEST_FX_VERSION',
            message: 'fx_version should be "cerulean" (latest stable)',
            fix: "Add: fx_version 'cerulean'",
        });
    }

    // Check game declaration
    if (!content.match(/game\s+['"]gta5['"]/i) && !content.match(/games?\s*\{[^}]*['"]gta5['"]/i)) {
        result.warnings.push({
            code: 'MANIFEST_NO_GAME',
            message: "Missing game 'gta5' declaration",
            fix: "Add: game 'gta5'",
        });
    }

    // Check for vehicles.meta in files{}
    const metaFiles = ['vehicles.meta', 'handling.meta', 'carcols.meta', 'carvariations.meta'];
    const declaredFiles = content.match(/files\s*\{([^}]*)\}/s);

    if (!declaredFiles) {
        result.errors.push({
            code: 'MANIFEST_NO_FILES',
            message: 'No files{} block found — meta files won\'t load',
            fix: "Add files{} block listing your .meta files",
        });
    } else {
        const filesBlock = declaredFiles[1];

        // Check vehicles.meta specifically
        if (!filesBlock.includes('vehicles.meta')) {
            result.errors.push({
                code: 'MANIFEST_NO_VEHICLES_META',
                message: 'vehicles.meta not listed in files{} — vehicle won\'t spawn',
                fix: "Add 'data/vehicles.meta' to your files{} block",
            });
        }

        // Check data_file declarations
        const dataFileMap = {
            'vehicles.meta': 'VEHICLE_METADATA_FILE',
            'handling.meta': 'HANDLING_FILE',
            'carcols.meta': 'CARCOLS_FILE',
            'carvariations.meta': 'VEHICLE_VARIATION_FILE',
        };

        for (const [meta, dataType] of Object.entries(dataFileMap)) {
            const metaExists = allFiles.some(f => path.basename(f).toLowerCase() === meta);
            if (metaExists) {
                if (!filesBlock.toLowerCase().includes(meta)) {
                    result.errors.push({
                        code: 'MANIFEST_META_NOT_IN_FILES',
                        message: `${meta} exists but is not listed in files{}`,
                        fix: `Add '${meta}' (or 'data/${meta}') to your files{} block`,
                    });
                }
                if (!content.includes(dataType)) {
                    result.errors.push({
                        code: 'MANIFEST_NO_DATA_FILE',
                        message: `Missing data_file '${dataType}' declaration for ${meta}`,
                        fix: `Add: data_file '${dataType}' 'data/${meta}'`,
                    });
                }
            }
        }
    }

    result.info.push({
        code: 'MANIFEST_OK',
        message: `Manifest: ${hasManifest ? 'fxmanifest.lua' : '__resource.lua (legacy)'}`,
    });
}

module.exports = { checkManifest };
