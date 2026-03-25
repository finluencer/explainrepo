const { parseFile } = require("../src/core/parser");

describe("parseFile", () => {
    it("extracts ES module imports", () => {
        const result = parseFile({ path: "a.js", content: `import foo from './foo';` });
        expect(result.imports).toContain("./foo");
    });

    it("extracts CommonJS require() calls", () => {
        const result = parseFile({ path: "a.js", content: `const x = require('./bar');` });
        expect(result.imports).toContain("./bar");
    });

    it("ignores require() with non-string argument", () => {
        const result = parseFile({ path: "a.js", content: `const x = require(someVar);` });
        expect(result.imports).toHaveLength(0);
    });

    it("returns empty imports for invalid syntax (no throw)", () => {
        const result = parseFile({ path: "bad.js", content: `this is not valid js @@@@` });
        expect(result.imports).toEqual([]);
        expect(result.file).toBe("bad.js");
    });

    it("returns empty imports for empty file", () => {
        const result = parseFile({ path: "empty.js", content: "" });
        expect(result.imports).toEqual([]);
    });

    it("parses TypeScript files", () => {
        const result = parseFile({
            path: "a.ts",
            content: `import { Foo } from './foo'; const x: string = 'hi';`,
        });
        expect(result.imports).toContain("./foo");
    });

    it("parses JSX files", () => {
        const result = parseFile({
            path: "a.jsx",
            content: `import React from 'react'; const App = () => <div />;`,
        });
        expect(result.imports).toContain("react");
    });

    it("returns empty imports for file with no imports", () => {
        const result = parseFile({ path: "a.js", content: `const x = 1 + 2;` });
        expect(result.imports).toEqual([]);
    });
});
