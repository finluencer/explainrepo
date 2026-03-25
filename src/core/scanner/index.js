const fs = require("fs");
const path = require("path");
const ignore = require("ignore");

const MAX_FILE_SIZE = 500 * 1024; // 500 KB

function loadGitignore(rootDir) {
    const gitignorePath = path.join(rootDir, ".gitignore");
    try {
        if (fs.existsSync(gitignorePath)) {
            return fs.readFileSync(gitignorePath, "utf-8").split("\n").filter(Boolean);
        }
    } catch (_) {}
    return [];
}

function isBinary(buffer) {
    // Check first 8KB for null bytes — reliable binary indicator
    const chunk = buffer.slice(0, Math.min(buffer.length, 8192));
    return chunk.includes(0);
}

function scanProject(rootDir) {
    const ig = ignore().add([
        ...loadGitignore(rootDir),
        "node_modules", ".git", "dist", "build",
        ".next", ".turbo", ".cache", ".vercel",
        "coverage", "out", ".claude",
    ]);

    const files = [];

    function walk(dir) {
        let entries;
        try {
            entries = fs.readdirSync(dir);
        } catch (_) {
            return; // permission denied or unreadable — skip silently
        }

        for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const relativePath = path.relative(rootDir, fullPath);

            if (ig.ignores(relativePath)) continue;

            let stat;
            try {
                stat = fs.lstatSync(fullPath); // lstat to avoid following symlinks
            } catch (_) {
                continue;
            }

            if (stat.isSymbolicLink()) continue; // skip symlinks entirely

            if (stat.isDirectory()) {
                walk(fullPath);
                continue;
            }

            const isCodeFile = /\.(js|ts|jsx|tsx|mjs|cjs|mts|cts)$/.test(entry);
            const isTestFile = /\.(test|spec)\.|__tests__|playwright|jest/.test(entry);

            if (!isCodeFile || isTestFile) continue;
            if (stat.size > MAX_FILE_SIZE) continue;

            let content;
            try {
                const buf = fs.readFileSync(fullPath);
                if (isBinary(buf)) continue;
                content = buf.toString("utf-8");
            } catch (_) {
                continue;
            }

            files.push({ path: relativePath, content });
        }
    }

    walk(rootDir);
    return files;
}

module.exports = { scanProject };
