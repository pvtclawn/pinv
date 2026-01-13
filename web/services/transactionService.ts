/**
 * Transaction phases enum for consistent state management
 */
export const TRANSACTION_PHASES = {
    IDLE: 'idle',
    SIMULATING: 'simulating',
    SIMULATE_SUCCESS: 'simulate_success',
    SIMULATE_ERROR: 'simulate_error',
    WRITING: 'writing',
    WRITE_SUCCESS: 'write_success',
    WRITE_ERROR: 'write_error',
    CONFIRMING: 'confirming',
    CONFIRMATION_SUCCESS: 'confirmation_success',
    CONFIRMATION_ERROR: 'confirmation_error'
};

/**
 * Determine the current transaction phase based on hook states
 * @param {Object} states - Object containing all transaction hook states
 * @returns {string} - Current transaction phase
 */
export function determineTransactionPhase(states: any) {
    const {
        isSimulateLoading,
        isSimulateSuccess,
        isSimulateError,
        isWritePending,
        isWriteSuccess,
        isWriteError,
        isConfirmationLoading,
        isConfirmationSuccess,
        isConfirmationError
    } = states;

    // Priority order: errors first, then loading states, then success states
    if (isConfirmationError) return TRANSACTION_PHASES.CONFIRMATION_ERROR;
    if (isWriteError) return TRANSACTION_PHASES.WRITE_ERROR;
    if (isSimulateError) return TRANSACTION_PHASES.SIMULATE_ERROR;

    if (isConfirmationLoading) return TRANSACTION_PHASES.CONFIRMING;
    if (isWritePending) return TRANSACTION_PHASES.WRITING;
    if (isSimulateLoading) return TRANSACTION_PHASES.SIMULATING;

    if (isConfirmationSuccess) return TRANSACTION_PHASES.CONFIRMATION_SUCCESS;
    if (isWriteSuccess) return TRANSACTION_PHASES.WRITE_SUCCESS;
    if (isSimulateSuccess) return TRANSACTION_PHASES.SIMULATE_SUCCESS;

    return TRANSACTION_PHASES.IDLE;
}

/**
 * Check if transaction is in a loading state
 * @param {string} phase - Current transaction phase
 * @returns {boolean} - True if transaction is loading
 */
export function isTransactionLoading(phase: string) {
    return [
        TRANSACTION_PHASES.SIMULATING,
        TRANSACTION_PHASES.WRITING,
        TRANSACTION_PHASES.CONFIRMING
    ].includes(phase);
}

/**
 * Check if transaction button should be disabled
 * @param {Object} params - Transaction parameters and states
 * @returns {boolean} - True if button should be disabled
 */
export function shouldDisableTransaction(params: any) {
    const { loggedIn, enabled, simulateData, phase, trigger } = params;

    if (!loggedIn || !enabled) return true;
    // Allow triggers to bypass simulation requirement
    if (!trigger && !simulateData?.request) return true;
    if (isTransactionLoading(phase)) return true;

    return false;
}

/**
 * Get appropriate button text based on transaction phase
 * @param {string} phase - Current transaction phase
 * @param {string} defaultText - Default button text
 * @returns {string} - Button text to display
 */
export function getTransactionButtonText(phase: string, defaultText?: string) {
    switch (phase) {
        case TRANSACTION_PHASES.SIMULATING:
            return 'Simulating...';
        case TRANSACTION_PHASES.WRITING:
            return 'Confirming...';
        case TRANSACTION_PHASES.CONFIRMING:
            return 'Processing...';
        case TRANSACTION_PHASES.SIMULATE_ERROR:
        case TRANSACTION_PHASES.WRITE_ERROR:
        case TRANSACTION_PHASES.CONFIRMATION_ERROR:
            return 'Retry';
        default:
            return defaultText || 'Submit';
    }
}

/**
 * Create transaction execution function with proper error handling
 * @param {Object} params - Transaction execution parameters
 * @returns {Function} - Transaction execution function
 */
export function createTransactionExecutor(params: any) {
    const { writeContract, simulateData, address } = params;

    return () => {
        if (!simulateData?.request || !address) {
            console.error('Transaction executor: Missing required data');
            return;
        }

        try {
            writeContract({
                ...simulateData.request,
                account: address
            });
        } catch (error) {
            console.error('Transaction execution failed:', error);
            throw error;
        }
    };
}