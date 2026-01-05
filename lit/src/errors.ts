export class LitClientError extends Error {
    constructor(message: string, public cause?: any) {
        super(message);
        this.name = 'LitClientError';
    }
}

export class LitActionError extends Error {
    constructor(public reason: string, message?: string) {
        super(message || `Lit Action failed: ${reason}`);
        this.name = 'LitActionError';
    }
}
