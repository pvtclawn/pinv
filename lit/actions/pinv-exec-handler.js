/**
 * PinV Execute Handler Lit Action
 * 
 * Inputs:
 * - handlerCid: string
 * - params: object
 * - context: object (viewer info, timestamps etc)
 */

const go = async () => {
    try {
        // We call the handler action.
        // Lit.Actions.call is available in recent versions.
        // If handlerCid refers to a Lit Action code on IPFS.

        // NOTE: This assumes `handlerCid` points to a file that resembles a Lit Action (eval-able JS).
        // And that we can pass params to it.

        const result = await Lit.Actions.call({
            ipfsId: handlerCid,
            params: {
                // Pass params through to the handler
                params: params,
                context: context || {}
            }
        });

        // The handler should return a response stringified.
        // We expect { ok: true, props: ... }

        // If Lit.Actions.call returns the string response directly?
        // Docs: "returns the response set by the child action via Lit.Actions.setResponse"

        // We just proxy it out, or wrap it?
        // Let's wrap it to ensure structure.

        let handlerOutput;
        try {
            handlerOutput = JSON.parse(result);
        } catch (e) {
            // If it failed to parse, maybe it's not JSON
            return Lit.Actions.setResponse({ response: JSON.stringify({ ok: false, reason: 'handler_output_invalid', details: result }) });
        }

        Lit.Actions.setResponse({ response: JSON.stringify(handlerOutput) });

    } catch (e) {
        Lit.Actions.setResponse({
            response: JSON.stringify({
                ok: false,
                reason: 'handler_execution_failed',
                details: e.message,
                propsFallback: {} // Should we provide a fallback here or let client handle?
            })
        });
    }
};

go();
