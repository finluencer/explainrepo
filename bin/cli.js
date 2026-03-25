#!/usr/bin/env node

const { program } = require("commander");
const { version } = require("../package.json");
const { error } = require("../src/utils/logger");

program
    .name("explainrepo")
    .description("Understand any codebase instantly")
    .version(version);

program
    .command("map")
    .description("Print repo structure and dependency graph")
    .action(() => {
        try { require("../src/commands/map")(); }
        catch (e) { error(e.message); process.exit(1); }
    });

program
    .command("overview [query]")
    .description("Summarize repo structure and execution flow")
    .action((query) => {
        try {
            if (query) console.log(`\nHint: use 'explainrepo find "${query}"' to search for specific logic.\n`);
            require("../src/commands/overview")();
        } catch (e) { error(e.message); process.exit(1); }
    });

program
    .command("find <query>")
    .description("Find relevant files for a query")
    .option("-n, --limit <number>", "max results to show", "5")
    .action((query, opts) => {
        try { require("../src/commands/find")(query, parseInt(opts.limit, 10) || 5); }
        catch (e) { error(e.message); process.exit(1); }
    });

// Unknown command
program.on("command:*", ([cmd]) => {
    error(`Unknown command: ${cmd}. Run 'explainrepo --help' for usage.`);
    process.exit(1);
});

// Unhandled errors
process.on("uncaughtException", (e) => {
    error(`Unexpected error: ${e.message}`);
    process.exit(1);
});

program.parse(process.argv);

// Show help when called with no args
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
