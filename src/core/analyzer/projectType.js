function detectProjectType(entry, graph) {
    if (!entry) return "Unknown";
    
    if (entry.includes("index.js")) {
        const deps = graph[entry] || [];
        
        const hasReact = deps.some(d => d.includes("App.js"));
        
        if (hasReact) return "React App";
    }
    
    return "Node/Unknown";
}

module.exports = { detectProjectType };
