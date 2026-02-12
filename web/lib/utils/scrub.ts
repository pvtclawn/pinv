/**
 * Utility to scrub sensitive patterns (API keys, private keys) from strings
 * to prevent accidental leakage in research datasets.
 */
export function scrubSecrets(input: string | any): string {
    if (!input) return "";
    
    let output = typeof input === 'string' ? input : JSON.stringify(input);

    const patterns = [
        // Ethereum Private Keys (0x followed by 64 hex chars)
        { regex: /0x[a-fA-F0-9]{64}/g, replacement: '[REDACTED_PK]' },
        
        // OpenAI API Keys (sk- followed by 48+ chars)
        { regex: /sk-[a-zA-Z0-9]{48,}/g, replacement: '[REDACTED_OPENAI_KEY]' },
        
        // Anthropic API Keys (sk-ant-...)
        { regex: /sk-ant-[a-zA-Z0-9-]{40,}/g, replacement: '[REDACTED_ANTHROPIC_KEY]' },
        
        // Generic API keys/tokens in JSON or key-value formats
        { regex: /api[_-]key["']?\s*[:=]\s*["']?[a-zA-Z0-9-]{16,}["']?/gi, replacement: 'api_key: "[REDACTED]"' },
        { regex: /bearer\s+[a-zA-Z0-9-._~+/]{20,}/gi, replacement: 'Bearer [REDACTED]' },

        // JWTs (Simplified: ey... . ey... . ...)
        { regex: /ey[a-zA-Z0-9-_]{10,}\.ey[a-zA-Z0-9-_]{10,}\.[a-zA-Z0-9-_]{10,}/g, replacement: '[REDACTED_JWT]' }
    ];

    for (const { regex, replacement } of patterns) {
        output = output.replace(regex, replacement);
    }

    return output;
}
