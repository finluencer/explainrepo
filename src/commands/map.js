const path = require("path");
const { buildEngine } = require("../core/engine");
const { divider } = require("../utils/logger");
const c = require("../utils/colors");

function buildTree(filePaths) {
    const root = {};
    filePaths.forEach(filePath => {
        const parts = filePath.split("/");
        let node = root;
        parts.forEach(part => {
            if (!node[part]) node[part] = {};
            node = node[part];
        });
    });
    return root;
}

function printTree(node, prefix, name, isLast) {
    const connector = isLast ? "└── " : "├── ";
    if (name) {
        const isDir = Object.keys(node).length > 0;
        const label = isDir ? c.bold(name + "/") : name;
        console.log(c.gray(prefix + connector) + label);
    }

    const children = Object.keys(node).sort((a, b) => {
        const aIsDir = Object.keys(node[a]).length > 0;
        const bIsDir = Object.keys(node[b]).length > 0;
        if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
        return a.localeCompare(b);
    });

    children.forEach((child, i) => {
        const last = i === children.length - 1;
        const newPrefix = name ? prefix + (isLast ? "    " : "│   ") : "";
        printTree(node[child], newPrefix, child, last);
    });
}

module.exports = function () {
    const root = process.cwd();
    const { files, graph, entry } = buildEngine(root);

    const folderName = path.basename(root);
    const graphFiles = Object.keys(graph);

    // ── Repo tree ──────────────────────────────────────────
    console.log(`\n${c.bold("Repo Structure")}`);
    divider();
    console.log(c.bold(c.cyan(folderName + "/")));
    const tree = buildTree(files.map(f => f.path));
    printTree(tree, "", null, true);

    // ── Dependency graph ───────────────────────────────────
    if (graphFiles.length) {
        console.log(`\n${c.bold("Dependency Graph")}`);
        divider();
        console.log(`${c.green("Entry:")} ${c.cyan(entry)}\n`);

        graphFiles.forEach(file => {
            const deps = graph[file];
            console.log(c.bold(file));
            deps.forEach(dep => console.log(`  ${c.gray("└─")} ${c.cyan(dep)}`));
        });
    }

    divider();
    console.log(c.gray(`Scanned: ${files.length} files  |  Graph: ${graphFiles.length} nodes`) + "\n");
};
