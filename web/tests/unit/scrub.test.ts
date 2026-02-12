import { expect, test, describe } from "bun:test";
import { scrubSecrets } from "../../lib/utils/scrub";

describe("Scrub Utility", () => {
    test("should redact Ethereum private keys", () => {
        const input = "My key is 0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1 and it is secret.";
        const output = scrubSecrets(input);
        expect(output).toBe("My key is [REDACTED_PK] and it is secret.");
    });

    test("should redact OpenAI API keys", () => {
        const input = "Bearer sk-1234567890abcdef1234567890abcdef1234567890abcdef12345678";
        const output = scrubSecrets(input);
        expect(output).toBe("Bearer [REDACTED_OPENAI_KEY]");
    });

    test("should redact Anthropic API keys", () => {
        const input = "sk-ant-api03-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef-abcdef";
        const output = scrubSecrets(input);
        expect(output).toContain("[REDACTED_ANTHROPIC_KEY]");
    });

    test("should redact generic api keys", () => {
        const input = '{"api-key": "my-secret-token-1234567890"}';
        const output = scrubSecrets(input);
        expect(output).toContain('api_key: "[REDACTED]"');
        
        const input2 = 'api_key=my-secret-token-1234567890';
        expect(scrubSecrets(input2)).toBe('api_key: "[REDACTED]"');
    });

    test("should redact JWTs", () => {
        const input = "eyabc123456789.eydef123456789.eyghi123456789-123456789";
        const output = scrubSecrets(input);
        expect(output).toBe("[REDACTED_JWT]");
    });

    test("should handle non-string inputs", () => {
        const input = { key: "0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123abc1" };
        const output = scrubSecrets(input);
        expect(output).toContain("[REDACTED_PK]");
    });
});
