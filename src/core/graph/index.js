const { detectEntry } = require("./entry");
const { parseFile } = require("../parser");
const { traverseGraph } = require("./traverse");

function buildGraph(files) {
    const entry = detectEntry(files);
    const parsed = files.map(parseFile);
    const graph = traverseGraph(entry, parsed, files);
    return { entry, graph };
}

module.exports = { buildGraph };
