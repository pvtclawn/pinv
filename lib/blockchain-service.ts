import { Pin } from '@/types';
import { MOCK_PINS } from './mock-data';

// Simulating an on-chain registry mapping FIDs to Pin Data (stored as IPFS hash or similar)
// For MVP, we just keep it in memory, but the interface mimics an async blockchain call.

class MockBlockchainService {
    private pins: Map<number, Pin>;

    constructor() {
        this.pins = new Map();
        // Initialize with mock data
        Object.values(MOCK_PINS).forEach((pin: Pin) => {
            this.pins.set(pin.fid, pin);
        });
    }

    // Simulate reading 'PinStruct' from a smart contract
    async getPin(fid: number): Promise<Pin | null> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));
        return this.pins.get(fid) || null;
    }

    // Simulate writing 'updatePin' transaction
    // In a real app, this would return a transaction hash
    async updatePin(fid: number, updates: Partial<Pin>): Promise<string> {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const existing = this.pins.get(fid);
        if (!existing) {
            throw new Error('Pin not found (on-chain)');
        }

        const updatedPin = { ...existing, ...updates, lastUpdated: new Date().toISOString() };
        this.pins.set(fid, updatedPin);

        return '0x' + Math.random().toString(16).slice(2) + '...'; // Mock Tx Hash
    }
}

// Singleton instance
export const blockchainService = new MockBlockchainService();
