const { buildEngine } = require("../core/engine");
const { searchFiles } = require("../core/analyzer/search");
const { divider, error } = require("../utils/logger");
const c = require("../utils/colors");

function summarizeReasons(reasons) {
    const inName    = new Set();
    const inContent = new Set();
    let hasVariant  = false;
    let hasDefine   = false;
    let proximity   = null;
    let allMatch    = false;

    for (const r of reasons) {
        if (r.startsWith("name:"))                                          inName.add(r.slice(5));
        else if (r.startsWith("name-variant:") || r.startsWith("name-fuzzy:")) inName.add(r.split(":")[1]);
        else if (r.startsWith("content:"))                                  inContent.add(r.slice(8));
        else if (r.startsWith("variant:"))                                  hasVariant = true;
        else if (r.startsWith("defines:"))                                  hasDefine  = true;
        else if (r.startsWith("proximity:"))                                proximity  = r.split(":")[1];
        else if (r === "~all-keywords-match")                               allMatch   = true;
    }

    const parts = [];
    if (inName.size)    parts.push(`in name: ${c.cyan([...inName].join(", "))}`);
    if (inContent.size) parts.push(`in content: ${c.cyan([...inContent].join(", "))}`);
    if (hasVariant)     parts.push(c.yellow("identifier match"));
    if (hasDefine)      parts.push(c.green("defines it"));
    if (proximity)      parts.push(`nearby ${c.cyan(proximity)}`);
    if (allMatch)       parts.push(c.green("all terms found"));

    return parts.join(c.gray("  |  "));
}

module.exports = function (query, limit = 5) {
    if (!query || !query.trim()) {
        error("Query cannot be empty.");
        process.exit(1);
    }

    const root = process.cwd();
    const { files, graph } = buildEngine(root);
    const results = searchFiles(graph, files, query, limit);

    console.log(`\n${c.bold("Query:")} ${query}`);
    divider();

    if (!results.length) {
        console.log(c.gray("No relevant files found."));
    } else {
        results.forEach((r, i) => {
            console.log(`${c.gray(`${i + 1}.`)} ${c.bold(r.file)}`);
            console.log(`   ${summarizeReasons(r.reasons)}`);
        });
    }

    console.log();
};
