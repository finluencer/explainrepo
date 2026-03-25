function detectStructure(graph) {
    const zones = {
        routes: [],
        services: [],
        store: [],
        utils: [],
    };
    
    Object.keys(graph).forEach(file => {
        if (file.includes("/routes/")) zones.routes.push(file);
        if (file.includes("/services/")) zones.services.push(file);
        if (file.includes("/store/")) zones.store.push(file);
        if (file.includes("/utils/")) zones.utils.push(file);
    });
    
    return zones;
}

module.exports = { detectStructure };
