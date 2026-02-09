export const BOOTSTRAP_CODE = `
const makeSafeLogger = (prefix = "") => (...args) => {
    const safeArgs = args.map(arg => {
        if (arg instanceof Error) {
            return arg.stack || arg.toString();
        }
        if (typeof arg === 'object' && arg !== null) {
            try {
                return JSON.stringify(arg, (k, v) => {
                    if (v instanceof Error) return v.stack || v.toString();
                    return typeof v === 'function' ? '[Function]' : v;
                });
            } catch (e) {
                return String(arg); 
            }
        }
        return String(arg);
    });
    // Prepend prefix to first arg if it exists, or push it
    if (prefix) {
        if (safeArgs.length > 0) safeArgs[0] = prefix + safeArgs[0];
        else safeArgs.push(prefix);
    }
    try {
        hostLog.applySync(undefined, safeArgs);
    } catch(e) { /* ignore */ }
};

global.console = { 
    log: makeSafeLogger(),
    error: makeSafeLogger("[ERROR] "),
    warn: makeSafeLogger("[WARN] "),
    info: makeSafeLogger("[INFO] "),
    debug: makeSafeLogger("[DEBUG] ")
};

global.fetch = async (url, options) => {
    // String->String Interface
    const argsJson = JSON.stringify({ url: String(url), options: options || {} });

    const resRef = await hostFetch.apply(undefined, [argsJson], { result: { promise: true } });
    
    let jsonStr;
    if (typeof resRef === 'object' && resRef !== null && typeof resRef.copy === 'function') {
            jsonStr = await resRef.copy();
    } else {
            jsonStr = resRef;
    }

    const res = JSON.parse(jsonStr);

    if (res.error) {
            throw new Error(res.error);
    }
    return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        text: async () => res.text,
        json: async () => {
            try {
                return JSON.parse(res.text);
            } catch (e) {
                throw new Error("API_INVALID_JSON: Response is not valid JSON. Status: " + res.status + " " + res.statusText + ". Body: " + (res.text || "").slice(0, 100));
            }
        }
    };
};
`;
