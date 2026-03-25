const { detectEntry } = require("../../src/core/graph/entry");

describe("detectEntry", () => {
    it("returns null for empty array", () => {
        expect(detectEntry([])).toBeNull();
    });

    it("prefers root-level server.js over index.js", () => {
        const files = [
            { path: "index.js",  content: "" },
            { path: "server.js", content: "" },
        ];
        expect(detectEntry(files)).toBe("server.js");
    });

    it("prefers root-level index.js", () => {
        const files = [
            { path: "src/index.js", content: "" },
            { path: "index.js",     content: "" },
        ];
        expect(detectEntry(files)).toBe("index.js");
    });

    it("falls back to src/index.js when no root entry", () => {
        const files = [
            { path: "src/index.js", content: "" },
            { path: "src/utils.js", content: "" },
        ];
        expect(detectEntry(files)).toBe("src/index.js");
    });

    it("falls back to file with most imports", () => {
        const files = [
            { path: "a.js", content: "require('./b'); require('./c');" },
            { path: "b.js", content: "const x = 1;" },
        ];
        expect(detectEntry(files)).toBe("a.js");
    });
});
