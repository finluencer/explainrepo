const path = require("path");

function resolveImport(fromFile, importPath, allFiles) {
    // ignore external libs
    if (!importPath.startsWith(".")) return null;
    
    const baseDir = path.dirname(fromFile);
    
    const possiblePaths = [
        path.join(baseDir, importPath),
        path.join(baseDir, importPath + ".js"),
        path.join(baseDir, importPath + ".ts"),
        path.join(baseDir, importPath, "index.js"),
    ];
    
    for (const p of possiblePaths) {
        const normalized = path.normalize(p);
        
        const match = allFiles.find(
            f => path.normalize(f.path) === normalized
        );
        
        if (match) return match.path;
    }
    
    return null;
}

module.exports = { resolveImport };
