const fs = require('fs');
const path = require('path');
const { checkManifest } = require('./checks/manifest');
const { checkVehiclesMeta } = require('./checks/vehicles-meta');
const { checkHandlingMeta } = require('./checks/handling-meta');
const { checkStreamFiles } = require('./checks/stream-files');
const { checkFolderStructure } = require('./checks/folder-structure');

/**
 * Validate a FiveM vehicle resource directory.
 * @param {string} resourcePath - Absolute path to the resource folder
 * @returns {object} Validation result with errors, warnings, info, and stats
 */
async function validateResource(resourcePath) {
    if (!fs.existsSync(resourcePath)) {
        throw new Error(`Path does not exist: ${resourcePath}`);
    }

    const stat = fs.statSync(resourcePath);
    if (!stat.isDirectory()) {
        throw new Error(`Path is not a directory: ${resourcePath}`);
    }

    const result = {
        resource: path.basename(resourcePath),
        path: resourcePath,
        errors: [],
        warnings: [],
        info: [],
        stats: {
            totalFiles: 0,
            streamFiles: 0,
            metaFiles: 0,
            totalSizeMB: 0,
            ytdFiles: [],
            yftFiles: [],
        },
    };

    // Collect all files recursively
    const allFiles = getAllFiles(resourcePath);
    result.stats.totalFiles = allFiles.length;
    result.stats.totalSizeMB = +(
        allFiles.reduce((sum, f) => sum + fs.statSync(f).size, 0) / 1024 / 1024
    ).toFixed(2);

    // Run all checks
    checkManifest(resourcePath, allFiles, result);
    checkVehiclesMeta(resourcePath, allFiles, result);
    checkHandlingMeta(resourcePath, allFiles, result);
    checkStreamFiles(resourcePath, allFiles, result);
    checkFolderStructure(resourcePath, allFiles, result);

    // Summary
    result.passed = result.errors.length === 0;

    return result;
}

/**
 * Recursively get all files in a directory.
 */
function getAllFiles(dir, fileList = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            getAllFiles(fullPath, fileList);
        } else {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

module.exports = { validateResource, getAllFiles };
