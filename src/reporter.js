/**
 * Format a validation result into a human-readable report.
 */
function formatReport(result, showFixHints = false) {
    const lines = [];

    lines.push('');
    lines.push(`  FiveM Vehicle Validator`);
    lines.push(`  ${'='.repeat(50)}`);
    lines.push(`  Resource:  ${result.resource}`);
    lines.push(`  Files:     ${result.stats.totalFiles} (${result.stats.totalSizeMB}MB)`);
    lines.push(`  Stream:    ${result.stats.streamFiles} files`);
    lines.push(`  Meta:      ${result.stats.metaFiles} files`);
    lines.push('');

    // Errors
    if (result.errors.length > 0) {
        lines.push(`  ERRORS (${result.errors.length})`);
        lines.push(`  ${'-'.repeat(50)}`);
        for (const err of result.errors) {
            lines.push(`  \u2718 [${err.code}] ${err.message}`);
            if (showFixHints && err.fix) {
                lines.push(`    \u2192 Fix: ${err.fix}`);
            }
        }
        lines.push('');
    }

    // Warnings
    if (result.warnings.length > 0) {
        lines.push(`  WARNINGS (${result.warnings.length})`);
        lines.push(`  ${'-'.repeat(50)}`);
        for (const warn of result.warnings) {
            lines.push(`  \u26A0 [${warn.code}] ${warn.message}`);
            if (showFixHints && warn.fix) {
                lines.push(`    \u2192 Fix: ${warn.fix}`);
            }
        }
        lines.push('');
    }

    // Info
    if (result.info.length > 0) {
        lines.push(`  INFO`);
        lines.push(`  ${'-'.repeat(50)}`);
        for (const info of result.info) {
            lines.push(`  \u2139 ${info.message}`);
        }
        lines.push('');
    }

    // YTD breakdown
    if (result.stats.ytdFiles.length > 0) {
        lines.push(`  YTD FILES`);
        lines.push(`  ${'-'.repeat(50)}`);
        for (const ytd of result.stats.ytdFiles) {
            const bar = getBar(ytd.sizeMB, 16);
            const status = ytd.sizeMB > 16 ? ' \u2718 OVER LIMIT' : ytd.sizeMB > 12 ? ' \u26A0' : ' \u2713';
            lines.push(`  ${ytd.name.padEnd(30)} ${ytd.sizeMB.toFixed(1).padStart(6)}MB ${bar}${status}`);
        }
        lines.push('');
    }

    // Result
    lines.push(`  ${'-'.repeat(50)}`);
    if (result.passed) {
        lines.push(`  \u2713 PASSED — Resource looks good!`);
    } else {
        lines.push(`  \u2718 FAILED — ${result.errors.length} error(s) must be fixed`);
    }

    if (result.errors.length > 0 || result.warnings.length > 0) {
        lines.push('');
        lines.push(`  Auto-fix tools:`);
        lines.push(`  \u2192 Optimize textures & models: https://fivemrides.com/optimizer/`);
        lines.push(`  \u2192 Rebuild resource structure: https://fivemrides.com/converter/`);
    }

    lines.push('');
    return lines.join('\n');
}

function getBar(value, max) {
    const width = 20;
    const filled = Math.min(Math.round((value / max) * width), width);
    return '[' + '\u2588'.repeat(filled) + '\u2591'.repeat(width - filled) + ']';
}

module.exports = { formatReport };
