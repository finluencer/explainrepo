function analyzeFolders(files) {
    const folders = {};
    
    files.forEach(file => {
        const parts = file.path.split("/");
        const topFolder = parts[0];
        
        if (!folders[topFolder]) {
            folders[topFolder] = 0;
        }
        
        folders[topFolder]++;
    });
    
    // Sort by importance (file count)
    const sorted = Object.entries(folders)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));
    
    return sorted;
}

module.exports = { analyzeFolders };
