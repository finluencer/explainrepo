const { traverseGraph } = require("../core/graph/traverse");
const { scanProject } = require("../core/scanner");
const { detectEntry } = require("../core/graph/entry");
const { parseFile } = require("../core/parser");
const { detectFlow } = require("../core/analyzer/flow");

//
const { detectProjectType } = require("../core/analyzer/projectType");
const { detectStructure } = require("../core/analyzer/structure");

module.exports = function () {
    const root = process.cwd();
    
    const files = scanProject(root);
    const entry = detectEntry(files);
    
    if (!entry) {
        console.log("Could not detect entry point");
        return;
    }
    
    const parsed = files.map(parseFile);
    const graph = traverseGraph(entry, parsed, files);
    
    // intelligence layer
    const type = detectProjectType(entry, graph);
    const structure = detectStructure(graph);
    const flow = detectFlow(entry, graph);
    
    // CLEAN OUTPUT
    console.log("\n==============================");
    console.log("ExplainRepo Summary");
    console.log("==============================\n");
    
    console.log("Entry Point:");
    console.log("  ", entry);
    
    console.log("\nProject Type:");
    console.log("  ", type);
    
    console.log("\nKey Areas:");
    
    if (structure.routes.length) {
        const base = structure.routes[0].split("/routes")[0];
        console.log("  - Routing:", base + "/routes");
    }
    
    if (structure.services.length) {
        const base = structure.services[0].split("/services")[0];
        console.log("  - Services:", base + "/services");
    }
    
    if (structure.store.length) {
        const base = structure.store[0].split("/store")[0];
        console.log("  - State:", base + "/store");
    }
    
    if (structure.utils.length) {
        const base = structure.utils[0].split("/utils")[0];
        console.log("  - Utils:", base + "/utils");
    }
    
    console.log("\nSuggested Starting Point:");
    console.log("  Start with", entry);
    
    console.log("\nStats:");
    console.log("  Relevant Files:", Object.keys(graph).length);
    
    console.log("\nFlow:");
    const shortFlow = flow.map(f => f.split("/").pop());
    console.log("  ", shortFlow.join(" → "));
    
    console.log("\n==============================\n");
};
