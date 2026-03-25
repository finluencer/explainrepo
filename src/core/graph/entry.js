const path = require("path");

function detectEntry(files) {
    // 1. Prefer root-level files
    const rootFiles = files.filter(f => !f.path.includes("/"));
    
    const priorityNames = [
        "server.js",
        "app.js",
        "index.js",
        "main.js",
    ];
    
    for (const name of priorityNames) {
        const found = rootFiles.find(f => f.path === name);
        if (found) return found.path;
    }
    
    // 2. Prefer common folders (src/, server/)
    const preferredDirs = ["src", "server", "app"];
    
    for (const dir of preferredDirs) {
        for (const name of priorityNames) {
            const found = files.find(f =>
                f.path === `${dir}/${name}`
            );
            if (found) return found.path;
        }
    }
    
    // 3. Smart fallback: file with most imports (likely entry)
    let maxImports = 0;
    let bestCandidate = null;
    
    for (const file of files) {
        const importCount = (file.content.match(/import|require/g) || []).length;
        
        if (importCount > maxImports) {
            maxImports = importCount;
            bestCandidate = file.path;
        }
    }
    
    return bestCandidate;
}

module.exports = { detectEntry };
