/**
 * Given an array of lowercase tokens, generate all standard code naming
 * convention variants. Works for ANY tokens — no domain knowledge needed.
 *
 * ["verify", "otp"] →
 *   verifyOtp, verifyOTP, VerifyOtp, VerifyOTP, OTPVerify, otpVerify,
 *   verify_otp, VERIFY_OTP, verify-otp, verifyotp, VERIFYOTP, ...
 */

function capitalize(word) {
    return word ? word[0].toUpperCase() + word.slice(1) : "";
}

function generateVariants(tokens) {
    if (!tokens || tokens.length === 0) return new Set();

    const variants = new Set();

    if (tokens.length === 1) {
        const t = tokens[0];
        variants.add(t);
        variants.add(t.toUpperCase());
        variants.add(capitalize(t));
        return variants;
    }

    const last = tokens[tokens.length - 1];
    const rest = tokens.slice(0, -1);

    // camelCase: verifyOtp
    variants.add(tokens[0] + tokens.slice(1).map(capitalize).join(""));
    // camelCase + last all-caps: verifyOTP
    variants.add(tokens[0] + rest.slice(1).map(capitalize).join("") + last.toUpperCase());
    // camelCase + first all-caps: OTPVerify
    variants.add(tokens[0].toUpperCase() + tokens.slice(1).map(capitalize).join(""));

    // PascalCase: VerifyOtp
    variants.add(tokens.map(capitalize).join(""));
    // PascalCase + last all-caps: VerifyOTP
    variants.add(rest.map(capitalize).join("") + last.toUpperCase());
    // PascalCase + first all-caps: OTPVerify (pascal)
    variants.add(tokens[0].toUpperCase() + tokens.slice(1).map(capitalize).join(""));

    // snake_case: verify_otp
    variants.add(tokens.join("_"));
    // SCREAMING_SNAKE: VERIFY_OTP
    variants.add(tokens.join("_").toUpperCase());
    // kebab-case: verify-otp
    variants.add(tokens.join("-"));
    // concatenated lowercase: verifyotp
    variants.add(tokens.join(""));
    // concatenated uppercase: VERIFYOTP
    variants.add(tokens.join("").toUpperCase());

    return variants;
}

/**
 * Generate variants for all consecutive pairs, triples, and the full token list.
 * Also runs reversed token order to catch "otpVerify" from ["verify","otp"].
 */
function generateAllVariants(keywords) {
    if (!keywords || keywords.length === 0) return new Set();

    const all = new Set();

    const addVariants = (tokens) => {
        for (const v of generateVariants(tokens)) all.add(v);
    };

    for (let i = 0; i < keywords.length; i++) {
        addVariants([keywords[i]]);

        if (i + 1 < keywords.length) {
            addVariants([keywords[i], keywords[i + 1]]);
            addVariants([keywords[i + 1], keywords[i]]); // reversed pair
        }

        if (i + 2 < keywords.length) {
            addVariants([keywords[i], keywords[i + 1], keywords[i + 2]]);
            addVariants([keywords[i + 2], keywords[i + 1], keywords[i]]); // reversed
        }
    }

    if (keywords.length > 1 && keywords.length <= 4) {
        addVariants(keywords);
        addVariants([...keywords].reverse());
    }

    return all;
}

module.exports = { generateAllVariants };