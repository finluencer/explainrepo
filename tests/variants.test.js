const { generateAllVariants } = require("../src/core/analyzer/variants");

describe("generateAllVariants", () => {
    it("returns empty Set for empty array", () => {
        expect(generateAllVariants([]).size).toBe(0);
    });

    it("single token includes lowercase, uppercase, capitalized", () => {
        const v = generateAllVariants(["otp"]);
        expect(v.has("otp")).toBe(true);
        expect(v.has("OTP")).toBe(true);
        expect(v.has("Otp")).toBe(true);
    });

    it("two tokens include camelCase variants", () => {
        const v = generateAllVariants(["verify", "otp"]);
        expect(v.has("verifyOtp")).toBe(true);
        expect(v.has("verifyOTP")).toBe(true);
        expect(v.has("VerifyOtp")).toBe(true);
        expect(v.has("VerifyOTP")).toBe(true);
    });

    it("two tokens include snake/kebab/screaming variants", () => {
        const v = generateAllVariants(["verify", "otp"]);
        expect(v.has("verify_otp")).toBe(true);
        expect(v.has("VERIFY_OTP")).toBe(true);
        expect(v.has("verify-otp")).toBe(true);
    });

    it("two tokens include reversed-order variants", () => {
        const v = generateAllVariants(["verify", "otp"]);
        expect(v.has("otpVerify")).toBe(true);
        expect(v.has("otp_verify")).toBe(true);
    });

    it("three tokens include consecutive pair and triple variants", () => {
        const v = generateAllVariants(["send", "otp", "email"]);
        // pair: send+otp
        expect(v.has("sendOtp")).toBe(true);
        // pair: otp+email
        expect(v.has("otpEmail")).toBe(true);
        // triple
        expect(v.has("sendOtpEmail")).toBe(true);
    });

    it("5 tokens do NOT generate full-list variants (explosion guard)", () => {
        const v = generateAllVariants(["a", "b", "c", "d", "e"]);
        // Should not contain a 5-token concatenation
        expect(v.has("abcde")).toBe(false);
        expect(v.has("ABCDE")).toBe(false);
    });
});
