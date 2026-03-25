const { buildEngine } = require("../core/engine");
const { detectProjectType } = require("../core/analyzer/projectType");
const { detectStructure } = require("../core/analyzer/structure");
const { detectFlow } = require("../core/analyzer/flow");
const { divider, warn } = require("../utils/logger");
const c = require("../utils/colors");

module.exports = function () {
    const root = process.cwd();
    const { files, entry, graph } = buildEngine(root);

    if (!entry) {
        warn("Could not detect an entry point. Try running from the project root.");
        return;
    }

    const type     = detectProjectType(entry, graph) || "Unknown";
    const structure = detectStructure(graph);
    const flow     = detectFlow(entry, graph);

    console.log(`\n${c.bold("ExplainRepo — Overview")}`);
    divider();

    console.log(`${c.green("✔")} ${c.bold("Entry Point")}`);
    console.log(`  ${c.cyan(entry)}`);

    console.log(`\n${c.green("✔")} ${c.bold("Project Type")}`);
    console.log(`  ${type}`);

    const areas = [];
    if (structure.routes.length)   areas.push(["Routes",   structure.routes[0].split("/routes")[0]   + "/routes"]);
    if (structure.services.length) areas.push(["Services", structure.services[0].split("/services")[0] + "/services"]);
    if (structure.store.length)    areas.push(["State",    structure.store[0].split("/store")[0]     + "/store"]);
    if (structure.utils.length)    areas.push(["Utils",    structure.utils[0].split("/utils")[0]     + "/utils"]);

    if (areas.length) {
        console.log(`\n${c.green("✔")} ${c.bold("Key Areas")}`);
        areas.forEach(([label, p]) => console.log(`  ${c.gray("-")} ${c.bold(label + ":")} ${c.cyan(p)}`));
    }

    if (flow.length) {
        console.log(`\n${c.green("✔")} ${c.bold("Flow")}`);
        const shortFlow = flow.map(f => f.split("/").pop());
        console.log(`  ${shortFlow.join(c.gray(" → "))}`);
    }

    console.log(`\n${c.green("✔")} ${c.bold("Stats")}`);
    console.log(`  Scanned: ${c.cyan(files.length)} files  |  Graph: ${c.cyan(Object.keys(graph).length)} nodes`);

    console.log(`\n${c.green("✔")} ${c.bold("Start Here")}`);
    console.log(`  ${c.cyan(entry)}`);

    divider();
    console.log();
};
