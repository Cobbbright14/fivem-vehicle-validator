const fs = require('fs');
const path = require('path');

/**
 * Check folder structure conventions.
 */
function checkFolderStructure(resourcePath, allFiles, result) {
    const hasStreamDir = fs.existsSync(path.join(resourcePath, 'stream'));
    const hasDataDir = fs.existsSync(path.join(resourcePath, 'data'));

    const streamExts = ['.ytd', '.yft', '.ydr', '.ydd', '.ybn'];
    const metaExts = ['.meta'];

    // Check if stream files are in root (should be in stream/)
    const rootStreamFiles = allFiles.filter(f => {
        const rel = path.relative(resourcePath, f);
        return !rel.includes(path.sep) && streamExts.includes(path.extname(f).toLowerCase());
    });

    if (rootStreamFiles.length > 0 && !hasStreamDir) {
        result.warnings.push({
            code: 'STRUCTURE_STREAM_IN_ROOT',
            message: `${rootStreamFiles.length} stream file(s) in resource root — convention is to use a stream/ folder`,
            fix: 'Move .ytd/.yft/.ydr files into a stream/ subdirectory',
        });
    }

    // Check if meta files are in root (should be in data/)
    const rootMetaFiles = allFiles.filter(f => {
        const rel = path.relative(resourcePath, f);
        return !rel.includes(path.sep) && metaExts.includes(path.extname(f).toLowerCase());
    });

    if (rootMetaFiles.length > 0 && !hasDataDir) {
        result.info.push({
            code: 'STRUCTURE_META_IN_ROOT',
            message: 'Meta files are in resource root — consider using a data/ folder for cleanliness',
        });
    }

    // Check for common junk files
    const junkPatterns = [
        { pattern: /\.bak$/i, name: 'backup files (.bak)' },
        { pattern: /thumbs\.db$/i, name: 'Thumbs.db' },
        { pattern: /\.ds_store$/i, name: '.DS_Store' },
        { pattern: /desktop\.ini$/i, name: 'desktop.ini' },
        { pattern: /\.tmp$/i, name: 'temp files (.tmp)' },
    ];

    for (const junk of junkPatterns) {
        const found = allFiles.filter(f => junk.pattern.test(path.basename(f)));
        if (found.length > 0) {
            result.warnings.push({
                code: 'STRUCTURE_JUNK_FILES',
                message: `Found ${found.length} ${junk.name} — should be removed`,
                fix: `Delete ${junk.name} from the resource`,
            });
        }
    }

    // Check for nested resource folders (common mistake: folder-in-folder)
    const nestedManifest = allFiles.filter(f => {
        const rel = path.relative(resourcePath, f);
        return (path.basename(f) === 'fxmanifest.lua' || path.basename(f) === '__resource.lua')
            && rel.includes(path.sep);
    });

    if (nestedManifest.length > 0) {
        result.warnings.push({
            code: 'STRUCTURE_NESTED_RESOURCE',
            message: `Found nested fxmanifest.lua inside subdirectory — resource may not load correctly`,
            fix: 'The fxmanifest.lua should be at the root of the resource folder, not nested inside',
        });
    }

    // Check for extremely deep nesting
    const maxDepth = allFiles.reduce((max, f) => {
        const depth = path.relative(resourcePath, f).split(path.sep).length;
        return Math.max(max, depth);
    }, 0);

    if (maxDepth > 5) {
        result.warnings.push({
            code: 'STRUCTURE_DEEP_NESTING',
            message: `Folder nesting depth of ${maxDepth} — may indicate extracted RPF archive structure`,
            fix: 'Flatten the folder structure. FiveM resources typically need at most 2-3 levels deep.',
        });
    }

    result.info.push({
        code: 'STRUCTURE_OK',
        message: `Structure: ${hasStreamDir ? 'stream/' : 'no stream/'}, ${hasDataDir ? 'data/' : 'no data/'}, ${allFiles.length} files, max depth ${maxDepth}`,
    });
}

module.exports = { checkFolderStructure };
