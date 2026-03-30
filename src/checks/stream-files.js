const fs = require('fs');
const path = require('path');

const STREAM_EXTENSIONS = ['.ytd', '.yft', '.ydr', '.ydd', '.ybn', '.ycd', '.ymap', '.ytyp'];
const YTD_STREAM_LIMIT_MB = 16;
const YTD_WARNING_MB = 12;

/**
 * Check stream files (YTD, YFT, YDR) for issues.
 */
function checkStreamFiles(resourcePath, allFiles, result) {
    const streamFiles = allFiles.filter(f =>
        STREAM_EXTENSIONS.includes(path.extname(f).toLowerCase())
    );

    result.stats.streamFiles = streamFiles.length;

    if (streamFiles.length === 0) {
        result.errors.push({
            code: 'STREAM_NO_FILES',
            message: 'No stream files found (YTD/YFT/YDR) — vehicle will be invisible',
            fix: 'Add vehicle model (.yft) and texture (.ytd) files to a stream/ folder',
        });
        return;
    }

    // Categorize
    const ytdFiles = streamFiles.filter(f => path.extname(f).toLowerCase() === '.ytd');
    const yftFiles = streamFiles.filter(f => path.extname(f).toLowerCase() === '.yft');
    const ydrFiles = streamFiles.filter(f => path.extname(f).toLowerCase() === '.ydr');

    result.stats.ytdFiles = ytdFiles.map(f => ({
        name: path.basename(f),
        sizeMB: +(fs.statSync(f).size / 1024 / 1024).toFixed(2),
    }));
    result.stats.yftFiles = yftFiles.map(f => ({
        name: path.basename(f),
        sizeMB: +(fs.statSync(f).size / 1024 / 1024).toFixed(2),
    }));

    // Check YTD sizes — 16MB streaming limit
    for (const ytd of ytdFiles) {
        const sizeMB = fs.statSync(ytd).size / 1024 / 1024;
        const name = path.basename(ytd);

        if (sizeMB > YTD_STREAM_LIMIT_MB) {
            result.errors.push({
                code: 'YTD_OVER_LIMIT',
                message: `${name} is ${sizeMB.toFixed(1)}MB — exceeds FiveM's 16MB streaming limit`,
                fix: `Compress textures in ${name} to get below 16MB. Use FiveMRides Optimizer: https://fivemrides.com/optimizer/`,
            });
        } else if (sizeMB > YTD_WARNING_MB) {
            result.warnings.push({
                code: 'YTD_NEAR_LIMIT',
                message: `${name} is ${sizeMB.toFixed(1)}MB — close to FiveM's 16MB streaming limit`,
                fix: `Consider optimizing ${name} to prevent texture loss on slower connections`,
            });
        }
    }

    // Check for YFT without YTD (vehicle won't have textures)
    if (yftFiles.length > 0 && ytdFiles.length === 0) {
        result.errors.push({
            code: 'STREAM_NO_YTD',
            message: 'YFT model files found but no YTD texture files — vehicle will be untextured',
            fix: 'Add the matching .ytd texture dictionary file(s)',
        });
    }

    // Check for _hi.yft without base .yft
    const hiFiles = yftFiles.filter(f => path.basename(f).toLowerCase().includes('_hi.yft'));
    for (const hi of hiFiles) {
        const baseName = path.basename(hi).replace(/_hi\.yft$/i, '.yft');
        const hasBase = yftFiles.some(f => path.basename(f).toLowerCase() === baseName.toLowerCase());
        if (!hasBase) {
            result.warnings.push({
                code: 'STREAM_HI_NO_BASE',
                message: `${path.basename(hi)} found but no matching ${baseName} — high-detail model without base LOD`,
                fix: `Add the base ${baseName} file or rename the _hi file`,
            });
        }
    }

    // Check for large YFT files (potential unoptimized models)
    for (const yft of yftFiles) {
        const sizeMB = fs.statSync(yft).size / 1024 / 1024;
        const name = path.basename(yft);
        if (sizeMB > 25) {
            result.warnings.push({
                code: 'YFT_LARGE',
                message: `${name} is ${sizeMB.toFixed(1)}MB — may cause lag for players`,
                fix: `Consider polygon decimation to reduce model complexity. Use FiveMRides Optimizer: https://fivemrides.com/optimizer/`,
            });
        }
    }

    // Estimate total resource streaming impact
    const totalStreamMB = streamFiles.reduce(
        (sum, f) => sum + fs.statSync(f).size / 1024 / 1024, 0
    );

    if (totalStreamMB > 50) {
        result.warnings.push({
            code: 'STREAM_TOTAL_LARGE',
            message: `Total stream size is ${totalStreamMB.toFixed(1)}MB — heavy resource for clients to download`,
            fix: 'Consider optimizing textures and models to reduce total stream size',
        });
    }

    result.info.push({
        code: 'STREAM_SUMMARY',
        message: `Stream: ${ytdFiles.length} YTD, ${yftFiles.length} YFT, ${ydrFiles.length} YDR — ${totalStreamMB.toFixed(1)}MB total`,
    });
}

module.exports = { checkStreamFiles };
