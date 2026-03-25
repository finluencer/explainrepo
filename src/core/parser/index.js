// Regex-based import extractor — no AST, no network-accessing dependencies.
// Covers all patterns we need: ES imports, CJS require(), dynamic import().

const PATTERNS = [
    // import ... from './foo'
    // import './foo'
    /\bimport\s+(?:[\w*{}\s,]+\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/g,
    // require('./foo')  require("./foo")
    /\brequire\s*\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g,
    // export { x } from './foo'
    /\bfrom\s+['"](\.{1,2}\/[^'"]+)['"]/g,
];

function parseFile(file) {
    const seen    = new Set();
    const imports = [];

    for (const pattern of PATTERNS) {
        // Reset lastIndex each time (patterns are defined with /g flag)
        let match;
        const re = new RegExp(pattern.source, pattern.flags);
        while ((match = re.exec(file.content)) !== null) {
            const imp = match[1];
            if (!seen.has(imp)) {
                seen.add(imp);
                imports.push(imp);
            }
        }
    }

    return { file: file.path, imports };
}

module.exports = { parseFile };
