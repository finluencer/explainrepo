const { generateAllVariants } = require("./variants");

// ─── Stop words ──────────────────────────────────────────────────────────────

const STOP_WORDS = new Set([
    "where", "is", "are", "the", "a", "an", "in", "of", "to", "for",
    "how", "what", "which", "who", "does", "do", "can", "i", "find",
    "show", "get", "method", "function", "file", "code", "logic",
    "implemented", "used", "defined", "called",
]);

// ─── Suffix normalization (stemming-lite, no external library) ────────────────

const IRREGULAR_STEMS = new Map([
    ["sent",       "send"],
    ["built",      "build"],
    ["cached",     "cache"],
    ["stored",     "store"],
    ["fetched",    "fetch"],
    ["logged",     "log"],
    ["parsed",     "parse"],
    ["queued",     "queue"],
    // Protected words — common terms that look like they have a suffix but shouldn't be stemmed
    ["business",   "business"],
    ["address",    "address"],
    ["process",    "process"],
    ["progress",   "progress"],
    ["access",     "access"],
    ["success",    "success"],
    ["erness",    "erness"],
]);

const SUFFIX_RULES = [
    ["ification", "ify"],   // verification → verify
    ["ications",  "icate"],
    ["ication",   "icate"], // authentication → authenticate
    ["izations",  "ize"],
    ["ization",   "ize"],   // authorization → authorize
    ["ations",    "ate"],
    ["ation",     "ate"],   // validation → validate
    ["ifying",    "ify"],   // verifying → verify
    ["ified",     "ify"],   // verified → verify
    ["ifies",     "ify"],
    ["cating",    "cate"],
    ["cated",     "cate"],  // authenticated → authenticate
    ["ating",     "ate"],   // validating → validate
    ["ated",      "ate"],
    ["izing",     "ize"],
    ["ized",      "ize"],
    ["ising",     "ise"],
    ["ised",      "ise"],
    ["ments",     ""],
    ["ment",      ""],
    ["ness",      ""],
    ["ings",      ""],
    ["ing",       ""],      // logging → log
    ["edly",      ""],
    ["ers",       "e"],
    ["er",        "e"],
    ["ed",        ""],      // logged → log
    ["ies",       "y"],     // verifies → verify
    ["es",        "e"],     // invoices → invoice
    ["s",         ""],      // payments → payment
];

function normalizeStem(word) {
    const lower = word.toLowerCase();
    if (lower.length <= 3) return lower;
    if (IRREGULAR_STEMS.has(lower)) return IRREGULAR_STEMS.get(lower);

    for (const [suffix, replacement] of SUFFIX_RULES) {
        if (lower.endsWith(suffix)) {
            const stem = lower.slice(0, lower.length - suffix.length) + replacement;
            if (stem.length >= 3) return stem;
        }
    }
    return lower;
}

// ─── Tier scoring ─────────────────────────────────────────────────────────────

const TIER_BONUS = {
    services: 6, service: 6,
    routes: 5, route: 5,
    controllers: 5, controller: 5,
    pages: 3, page: 3,
    models: 3, model: 3,
};

const TIER_PENALTY = [
    "utils", "util", "helpers", "helper",
    "constants", "constant", "__tests__", ".test.", ".spec.",
];

function tierScore(filePath) {
    const lower = filePath.toLowerCase();
    for (const [segment, bonus] of Object.entries(TIER_BONUS)) {
        if (lower.includes(`/${segment}/`) || lower.includes(`/${segment}.`)) return bonus;
    }
    for (const segment of TIER_PENALTY) {
        if (lower.includes(segment)) return -2;
    }
    return 0;
}

// ─── Definition detection ─────────────────────────────────────────────────────

function definitionScore(content, keyword) {
    if (keyword.length < 4) return 0;
    const k = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
        new RegExp(`function\\s+${k}\\s*\\(`, "i"),
        new RegExp(`${k}\\s*=\\s*(async\\s+)?function`, "i"),
        new RegExp(`${k}\\s*=\\s*(async\\s+)?\\(`, "i"),
        new RegExp(`async\\s+${k}\\s*\\(`, "i"),
        new RegExp(`class\\s+${k}[\\s{(]`, "i"),
    ];
    return patterns.some(re => re.test(content)) ? 5 : 0;
}

// ─── Proximity scoring ────────────────────────────────────────────────────────

const PROX = { TIGHT: 10, MEDIUM: 30, LOOSE: 100, MAX: 8 };

function proximityScore(content, keywords) {
    if (keywords.length < 2) return 0;

    const lines = content.split("\n");
    const occurrences = new Map(keywords.map(kw => [kw, []]));

    for (let i = 0; i < lines.length; i++) {
        const l = lines[i].toLowerCase();
        for (const kw of keywords) {
            if (l.includes(kw)) occurrences.get(kw).push(i);
        }
    }

    // All keywords must appear at least once
    for (const [, pos] of occurrences) {
        if (pos.length === 0) return 0;
    }

    // Merge and sort events, then sliding-window minimum span
    const events = [];
    for (const [kw, positions] of occurrences) {
        for (const pos of positions) events.push([pos, kw]);
    }
    events.sort((a, b) => a[0] - b[0]);

    const windowCount = new Map();
    let satisfied = 0;
    let left = 0;
    let minSpan = Infinity;

    for (let right = 0; right < events.length; right++) {
        const kw = events[right][1];
        const prev = windowCount.get(kw) || 0;
        windowCount.set(kw, prev + 1);
        if (prev === 0) satisfied++;

        while (satisfied === keywords.length) {
            minSpan = Math.min(minSpan, events[right][0] - events[left][0]);
            const leftKw = events[left][1];
            const lc = windowCount.get(leftKw);
            if (lc === 1) satisfied--;
            windowCount.set(leftKw, lc - 1);
            left++;
        }
    }

    if (minSpan <= PROX.TIGHT)  return PROX.MAX;
    if (minSpan <= PROX.MEDIUM) return Math.round(PROX.MAX * 0.5);
    if (minSpan <= PROX.LOOSE)  return Math.round(PROX.MAX * 0.25);
    return 0;
}

// ─── Fuzzy path matching (edit distance ≤ 1 on path segments) ────────────────

function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > 1) return 2;
    const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    const curr = new Array(b.length + 1);
    for (let i = 1; i <= a.length; i++) {
        curr[0] = i;
        for (let j = 1; j <= b.length; j++) {
            curr[j] = a[i - 1] === b[j - 1]
                ? prev[j - 1]
                : 1 + Math.min(prev[j - 1], prev[j], curr[j - 1]);
        }
        prev.splice(0, prev.length, ...curr);
    }
    return prev[b.length];
}

function fuzzyPathMatch(filePath, keyword) {
    if (keyword.length < 5) return false;
    const segments = filePath.toLowerCase().split(/[/._-]/);
    return segments.some(seg => seg.length >= 4 && editDistance(seg, keyword) === 1);
}

// ─── Keyword extraction ───────────────────────────────────────────────────────

function extractKeywords(query) {
    const words = query.toLowerCase().split(/\s+/);
    const filtered = words.filter(w => !STOP_WORDS.has(w) && w.length >= 2);
    const stemmed = [...new Set(filtered.map(normalizeStem))];
    return stemmed;
}

// ─── Main search ──────────────────────────────────────────────────────────────

function searchFiles(graph, files, query, limit = 5) {
    const keywords = extractKeywords(query);
    if (!keywords.length) return [];

    // Pre-generate all naming variants once (not per file)
    const variants = generateAllVariants(keywords);

    const results = [];

    for (const file of files) {
        const reasons = [];
        let score = 0;

        const pathLower = file.path.toLowerCase();

        // 1. Path matches — exact stemmed keyword
        for (const kw of keywords) {
            if (pathLower.includes(kw)) {
                score += 5;
                reasons.push(`name:${kw}`);
            }
        }

        // 2. Path matches — code naming variants (skip if already matched as keyword)
        for (const v of variants) {
            if (file.path.includes(v) && !keywords.some(kw => pathLower.includes(kw) && kw === v.toLowerCase())) {
                score += 4;
                reasons.push(`name-variant:${v}`);
            }
        }

        // 3. Fuzzy path match (typo tolerance)
        for (const kw of keywords) {
            if (!pathLower.includes(kw) && fuzzyPathMatch(file.path, kw)) {
                score += 1;
                reasons.push(`name-fuzzy:${kw}`);
            }
        }

        // 4. Content matches — stemmed keywords
        const contentMatched = new Set();
        for (const kw of keywords) {
            if (file.content.toLowerCase().includes(kw)) {
                score += 2;
                reasons.push(`content:${kw}`);
                contentMatched.add(kw);
            }
        }

        // 5. Content matches — code naming variants (skip single-word variants already matched)
        let variantHit = false;
        for (const v of variants) {
            if (file.content.includes(v) && !keywords.includes(v.toLowerCase())) {
                score += 3;
                if (!variantHit) {
                    reasons.push(`variant:${v}`); // show first hit only to keep reasons clean
                    variantHit = true;
                }
            }
        }

        // 6. Definition detection — keyword defined as function/class
        for (const kw of keywords) {
            if (definitionScore(file.content, kw) > 0) {
                score += 5;
                reasons.push(`defines:${kw}`);
            }
        }
        for (const v of variants) {
            if (definitionScore(file.content, v) > 0) {
                score += 4;
                reasons.push(`defines:${v}`);
            }
        }

        // 7. Proximity — how close the keywords appear to each other in the file
        const presentKeywords = keywords.filter(kw => contentMatched.has(kw));
        if (presentKeywords.length >= 2) {
            const prox = proximityScore(file.content, presentKeywords);
            if (prox > 0) {
                score += prox;
                reasons.push(`proximity:+${prox}`);
            }
        }

        // 8. Co-occurrence bonus — all keywords found somewhere in the file
        const allCovered = keywords.every(kw =>
            contentMatched.has(kw) || pathLower.includes(kw)
        );
        if (keywords.length > 1 && allCovered) {
            score += keywords.length * 3;
            reasons.push("~all-keywords-match");
        }

        // 9. Tier bonus/penalty
        score += tierScore(file.path);

        if (score > 0 && reasons.length > 0) {
            results.push({ file: file.path, score, reasons: [...new Set(reasons)] });
        }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

module.exports = { searchFiles, normalizeStem, extractKeywords };