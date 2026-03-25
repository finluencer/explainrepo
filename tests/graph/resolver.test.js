const { resolveImport } = require("../../src/core/graph/resolver");

const files = [
    { path: "src/auth.js" },
    { path: "src/utils/token.js" },
    { path: "src/services/index.js" },
];

describe("resolveImport", () => {
    it("returns null for external imports", () => {
        expect(resolveImport("src/index.js", "express", files)).toBeNull();
        expect(resolveImport("src/index.js", "@babel/parser", files)).toBeNull();
    });

    it("resolves a direct relative import", () => {
        expect(resolveImport("src/index.js", "./auth", files)).toBe("src/auth.js");
    });

    it("resolves import that needs .js appended", () => {
        expect(resolveImport("src/index.js", "./auth", files)).toBe("src/auth.js");
    });

    it("resolves ../ relative path", () => {
        expect(resolveImport("src/utils/helpers.js", "../auth", files)).toBe("src/auth.js");
    });

    it("resolves directory import to index.js", () => {
        expect(resolveImport("src/index.js", "./services", files)).toBe("src/services/index.js");
    });

    it("returns null for unresolvable import", () => {
        expect(resolveImport("src/index.js", "./nonexistent", files)).toBeNull();
    });
});
