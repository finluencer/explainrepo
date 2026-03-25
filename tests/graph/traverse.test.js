const { traverseGraph } = require("../../src/core/graph/traverse");

describe("traverseGraph", () => {
    it("returns empty graph for null entry", () => {
        expect(traverseGraph(null, [], [])).toEqual({});
    });

    it("builds correct adjacency list", () => {
        const allFiles   = [{ path: "a.js" }, { path: "b.js" }];
        const parsed     = [
            { file: "a.js", imports: ["./b"] },
            { file: "b.js", imports: [] },
        ];
        const graph = traverseGraph("a.js", parsed, allFiles);
        expect(graph["a.js"]).toEqual(["b.js"]);
        expect(graph["b.js"]).toEqual([]);
    });

    it("handles circular dependencies without infinite loop", () => {
        const allFiles = [{ path: "a.js" }, { path: "b.js" }];
        const parsed   = [
            { file: "a.js", imports: ["./b"] },
            { file: "b.js", imports: ["./a"] },
        ];
        expect(() => traverseGraph("a.js", parsed, allFiles)).not.toThrow();
        const graph = traverseGraph("a.js", parsed, allFiles);
        expect(Object.keys(graph)).toHaveLength(2);
    });

    it("excludes unresolvable imports from deps", () => {
        const allFiles = [{ path: "a.js" }];
        const parsed   = [{ file: "a.js", imports: ["./nonexistent"] }];
        const graph    = traverseGraph("a.js", parsed, allFiles);
        expect(graph["a.js"]).toEqual([]);
    });

    it("deduplicates repeated imports", () => {
        const allFiles = [{ path: "a.js" }, { path: "b.js" }];
        const parsed   = [
            { file: "a.js", imports: ["./b", "./b", "./b"] },
            { file: "b.js", imports: [] },
        ];
        const graph = traverseGraph("a.js", parsed, allFiles);
        expect(graph["a.js"]).toEqual(["b.js"]);
    });
});
