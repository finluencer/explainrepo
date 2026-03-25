const { normalizeStem, extractKeywords, searchFiles } = require("../src/core/analyzer/search");

// ─── normalizeStem ────────────────────────────────────────────────────────────

describe("normalizeStem", () => {
    it("returns short words unchanged (<=3 chars)", () => {
        expect(normalizeStem("log")).toBe("log");
        expect(normalizeStem("otp")).toBe("otp");
    });

    it("strips -ified suffix (verified → verify)", () => {
        expect(normalizeStem("verified")).toBe("verify");
    });

    it("strips -ification suffix (verification → verify)", () => {
        expect(normalizeStem("verification")).toBe("verify");
    });

    it("strips -ication suffix (authentication → authenticate)", () => {
        expect(normalizeStem("authentication")).toBe("authenticate");
    });

    it("strips -ation suffix (validation → validate)", () => {
        expect(normalizeStem("validation")).toBe("validate");
    });

    it("strips -ments suffix (payments → pay)", () => {
        // "ments" rule fires before "s" — result is "pay", which still matches payment content
        expect(normalizeStem("payments")).toBe("pay");
    });

    it("strips -ing suffix (routing → rout)", () => {
        expect(normalizeStem("routing")).toBe("rout");
    });

    it("protects 'business' from ness-stripping", () => {
        expect(normalizeStem("business")).toBe("business");
    });

    it("protects 'process' from -ess stripping", () => {
        expect(normalizeStem("process")).toBe("process");
    });
});

// ─── extractKeywords ──────────────────────────────────────────────────────────

describe("extractKeywords", () => {
    it("removes stop words", () => {
        expect(extractKeywords("where is auth")).toEqual(["auth"]);
    });

    it("lowercases and stems", () => {
        expect(extractKeywords("Verified")).toEqual(["verify"]);
    });

    it("handles multi-word query", () => {
        expect(extractKeywords("verify OTP")).toEqual(["verify", "otp"]);
    });

    it("returns [] for empty string", () => {
        expect(extractKeywords("")).toEqual([]);
    });

    it("returns [] when all words are stop words", () => {
        expect(extractKeywords("is the a")).toEqual([]);
    });

    it("deduplicates after stemming", () => {
        // "verified" and "verification" both stem to "verify"
        const result = extractKeywords("verified verification");
        expect(result).toEqual(["verify"]);
    });
});

// ─── searchFiles ──────────────────────────────────────────────────────────────

describe("searchFiles", () => {
    const graph = {};

    it("returns [] for stop-word-only query", () => {
        const files = [{ path: "src/auth.js", content: "const x = 1;" }];
        expect(searchFiles(graph, files, "where is the")).toEqual([]);
    });

    it("returns [] when no files match", () => {
        const files = [{ path: "src/foo.js", content: "const x = 1;" }];
        expect(searchFiles(graph, files, "payment")).toHaveLength(0);
    });

    it("file with keyword in path scores higher than keyword only in content", () => {
        const files = [
            { path: "src/auth.js",   content: "const x = 1;" }, // path match (+5)
            { path: "src/other.js",  content: "// handles auth" }, // content match only (+2)
        ];
        const results = searchFiles(graph, files, "auth");
        expect(results[0].file).toBe("src/auth.js");
    });

    it("file with both keywords scores higher than file with one", () => {
        const files = [
            { path: "a.js", content: "verify\notp\n" },    // both keywords
            { path: "b.js", content: "verify\n" },          // one keyword
        ];
        const results = searchFiles(graph, files, "verify otp");
        expect(results[0].file).toBe("a.js");
    });

    it("proximity +8 when keywords within 10 lines", () => {
        const closeContent = "verify\notp\n".repeat(1);
        const farContent   = "verify\n" + "x\n".repeat(50) + "otp\n";
        const files = [
            { path: "far.js",   content: farContent },
            { path: "close.js", content: closeContent },
        ];
        const results = searchFiles(graph, files, "verify otp");
        expect(results[0].file).toBe("close.js");
    });

    it("services/ tier ranks above utils/ for same keyword match", () => {
        const files = [
            { path: "src/utils/auth.js",    content: "auth" },
            { path: "src/services/auth.js", content: "auth" },
        ];
        const results = searchFiles(graph, files, "auth");
        expect(results[0].file).toBe("src/services/auth.js");
    });

    it("respects limit parameter", () => {
        const files = Array.from({ length: 10 }, (_, i) => ({
            path: `src/auth${i}.js`,
            content: "auth",
        }));
        expect(searchFiles(graph, files, "auth", 3)).toHaveLength(3);
    });

    it("detects function definition and adds defines reason", () => {
        const files = [{
            path: "src/otp.js",
            content: "async function verifyOtp(user, code) { return user.otp === code; }",
        }];
        const results = searchFiles(graph, files, "verify otp");
        expect(results).toHaveLength(1);
        const reasons = results[0].reasons;
        const hasDefine = reasons.some(r => r.startsWith("defines:"));
        expect(hasDefine).toBe(true);
    });

    it("matches code naming variant in file content", () => {
        const files = [{
            path: "src/handler.js",
            content: "const result = verifyOtp(user, code);",
        }];
        const results = searchFiles(graph, files, "verify otp");
        expect(results).toHaveLength(1);
        const reasons = results[0].reasons;
        const hasVariant = reasons.some(r => r.startsWith("variant:"));
        expect(hasVariant).toBe(true);
    });
});
