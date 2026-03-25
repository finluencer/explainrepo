function detectFlow(entry, graph) {
    const flow = [];
    const visited = new Set();
    
    function pickNext(deps) {
        if (!deps.length) return null;
        
        // HARD PRIORITY ORDER
        return (
            deps.find(d => d.includes("App.js")) ||
            deps.find(d => d.includes("/routes/index")) ||
            deps.find(d => d.includes("RoutesContainer")) ||
            deps.find(d => d.includes("/routes/")) ||
            deps.find(d => d.includes("/pages/")) ||
            deps.find(d => d.includes("/services/")) ||
            null
        );
    }
    
    let current = entry;
    
    while (current && !visited.has(current)) {
        visited.add(current);
        flow.push(current);
        
        let deps = graph[current] || [];
        
        // remove visited (prevents loops)
        deps = deps.filter(d => !visited.has(d));
        
        const next = pickNext(deps);
        
        if (!next) break;
        
        current = next;
    }
    
    return flow;
}

module.exports = { detectFlow };
