// Canonicalize params with stable ordering, normalize strings (trim), and ensure deterministic JSON.
export interface NormalizedParams {
    [key: string]: string;
}

export function canonicalizeParams(input: any): NormalizedParams {
    const output: NormalizedParams = {};
    if (!input || typeof input !== 'object') return output;

    // Sort keys mostly for stability, though JSON.stringify isn't guaranteed stable across engines without sorting
    // But we will hash the result of this function, so we need a deterministic string representation later.
    const keys = Object.keys(input).sort();

    keys.forEach(key => {
        const val = input[key];
        if (val === undefined || val === null) return;

        if (typeof val === 'string') {
            output[key] = val.trim();
        } else {
            // Force everything to string for simplicity in OG params
            output[key] = String(val).trim();
        }
    });

    return output;
}

// Compute paramsHash: keccak256(utf8(canonical_json_string))
// We'll use simple JSON.stringify on the sorted object for now.
// For strict EIP-712 usually we verify the STRUCT, but here we are treating params as a blob hash 
// bound to the signature.
export function computeParamsHash(params: NormalizedParams): string {
    // Ensure keys are sorted in the string output
    // JSON.stringify order is not guaranteed by spec but V8/Node respects key insertion order for non-integers.
    // To be 100% safe, we can rebuild the object one last time in sorted order or just map it.
    const sortedKeys = Object.keys(params).sort();
    const sortedObj: Record<string, string> = {};
    for (const key of sortedKeys) {
        sortedObj[key] = params[key];
    }
    return JSON.stringify(sortedObj);
}
