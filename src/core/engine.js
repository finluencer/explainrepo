const path = require("path");
const fs = require("fs");
const { scanProject } = require("./scanner");
const { parseFile } = require("./parser");
const { detectEntry } = require("./graph/entry");
const { traverseGraph } = require("./graph/traverse");
const { progressStart, progressDone, warn } = require("../utils/logger");

function buildEngine(rootDir) {
    if (!rootDir) throw new Error("rootDir is required");

    try {
        fs.accessSync(rootDir, fs.constants.R_OK);
    } catch (_) {
        throw new Error(`Cannot read directory: ${rootDir}`);
    }

    progressStart("Scanning...");
    let files;
    try {
        files = scanProject(rootDir);
    } finally {
        progressDone();
    }

    if (!files.length) {
        warn("No source files found. Are you in the right directory?");
        return { files: [], entry: null, parsed: [], graph: {} };
    }

    const entry = detectEntry(files);
    const parsed = files.map(f => { try { return parseFile(f); } catch (_) { return { file: f.path, imports: [] }; } });
    const graph = traverseGraph(entry, parsed, files);

    return { files, entry, parsed, graph };
}

module.exports = { buildEngine };
