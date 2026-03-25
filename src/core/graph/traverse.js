const { resolveImport } = require("./resolver");

function traverseGraph(entry, parsedFiles, allFiles) {
    const visited = new Set();
    const graph = {};
    
    function dfs(currentFile) {
        if (visited.has(currentFile)) return;
        
        visited.add(currentFile);
        
        const fileData = parsedFiles.find(f => f.file === currentFile);
        
        if (!fileData) return;
        
        const resolvedDeps = [...new Set(
            fileData.imports
                .map(imp => resolveImport(currentFile, imp, allFiles))
                .filter(Boolean)
        )];

        graph[currentFile] = resolvedDeps;
        
        resolvedDeps.forEach(dep => dfs(dep));
    }
    
    if (entry) {
        dfs(entry);
    }
    
    return graph;
}

module.exports = { traverseGraph };
