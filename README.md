# fivem-vehicle-validator

Validate FiveM vehicle resources for common issues before deploying to your server. Catches broken manifests, missing meta files, oversized textures, and structural problems.

```
  FiveM Vehicle Validator
  ==================================================
  Resource:  my-lambo
  Files:     8 (34.2MB)
  Stream:    5 files
  Meta:      3 files

  ERRORS (1)
  --------------------------------------------------
  ✘ [YTD_OVER_LIMIT] lambo.ytd is 18.3MB — exceeds FiveM's 16MB streaming limit
    → Fix: Compress textures. Use FiveMRides Optimizer: https://fivemrides.com/optimizer/

  WARNINGS (1)
  --------------------------------------------------
  ⚠ [HANDLING_SUSPICIOUS_VALUE] fMass = 80000 seems unusual (expected 100-50000 kg)

  YTD FILES
  --------------------------------------------------
  lambo.ytd                         18.3MB [████████████████████████░░] ✘ OVER LIMIT
  lambo+hi.ytd                       8.1MB [██████████░░░░░░░░░░] ✓

  --------------------------------------------------
  ✘ FAILED — 1 error(s) must be fixed
```

## Install

```bash
npm install -g fivem-vehicle-validator
```

Or use without installing:

```bash
npx fivem-vehicle-validator ./my-vehicle
```

## Usage

```bash
# Validate a resource
fivem-validate ./resources/my-car

# Show fix suggestions
fivem-validate ./resources/my-car --fix-hints

# JSON output (for CI/scripts)
fivem-validate ./resources/my-car --json

# Validate all resources in a folder
for dir in ./resources/*/; do fivem-validate "$dir"; done
```

## What It Checks

### Errors (must fix)

| Code | Description |
|------|-------------|
| `MANIFEST_MISSING` | No fxmanifest.lua or __resource.lua |
| `MANIFEST_NO_FILES` | No `files{}` block in manifest |
| `MANIFEST_NO_VEHICLES_META` | vehicles.meta not in `files{}` |
| `MANIFEST_NO_DATA_FILE` | Missing `data_file` declaration for a meta file |
| `MANIFEST_META_NOT_IN_FILES` | Meta file exists but not listed in `files{}` |
| `VEHICLES_META_MISSING` | No vehicles.meta found |
| `VEHICLES_META_INVALID_XML` | vehicles.meta is not valid XML |
| `VEHICLES_META_NO_ITEMS` | No vehicle entries in vehicles.meta |
| `VEHICLES_META_DUPLICATE_MODEL` | Duplicate modelName (spawn conflicts) |
| `VEHICLES_META_MISSING_FIELD` | Missing required field (modelName, txdName, etc.) |
| `YTD_OVER_LIMIT` | YTD file exceeds 16MB streaming limit |
| `STREAM_NO_FILES` | No stream files (vehicle invisible) |
| `STREAM_NO_YTD` | Models found but no textures |

### Warnings (should fix)

| Code | Description |
|------|-------------|
| `MANIFEST_LEGACY` | Using deprecated __resource.lua |
| `MANIFEST_FX_VERSION` | fx_version not set to cerulean |
| `YTD_NEAR_LIMIT` | YTD between 12-16MB (risky) |
| `YFT_LARGE` | Model file over 25MB (lag risk) |
| `STREAM_TOTAL_LARGE` | Total stream over 50MB |
| `STREAM_HI_NO_BASE` | _hi.yft without matching base .yft |
| `HANDLING_SUSPICIOUS_VALUE` | Physics value outside normal range |
| `STRUCTURE_STREAM_IN_ROOT` | Stream files not in stream/ folder |
| `STRUCTURE_JUNK_FILES` | Thumbs.db, .DS_Store, etc. |
| `STRUCTURE_NESTED_RESOURCE` | fxmanifest.lua in wrong directory |

## Programmatic API

```javascript
const { validateResource } = require('fivem-vehicle-validator');

const result = await validateResource('./my-vehicle');

console.log(result.passed);     // true/false
console.log(result.errors);     // [{code, message, fix}]
console.log(result.warnings);   // [{code, message, fix}]
console.log(result.stats);      // {totalFiles, streamFiles, ytdFiles, ...}
```

## Auto-Fix Tools

Found issues? Fix them automatically:

- **Oversized YTD / unoptimized textures** → [FiveMRides Optimizer](https://fivemrides.com/optimizer/) — Smart BC5/BC7 compression, reduces file sizes 40-70%
- **Broken resource structure / missing meta** → [FiveMRides Converter](https://fivemrides.com/converter/) — Rebuilds complete resource with fxmanifest, handling, and 102 engine sounds
- **Need to convert from GTA5-Mods.com** → [FiveMRides Converter](https://fivemrides.com/convert/) — Upload ZIP/RPF, get FiveM-ready resource in seconds

## Why 16MB Matters

FiveM has a hard streaming limit: any single YTD file over 16MB will cause **texture loss** in-game. The textures simply won't load. This is the #1 cause of invisible/blurry vehicles on FiveM servers.

This validator checks every YTD file against this limit and warns you before you deploy a broken resource.

Read more: [How to Fix FiveM Texture Loss](https://fivemrides.com/fivem-texture-loss-fix/)

## Contributing

Issues and PRs welcome. If you'd like to add new checks, each check is a separate module in `src/checks/`.

## License

MIT — [FiveMRides](https://fivemrides.com)
