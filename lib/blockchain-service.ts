import { Pin } from '@/types';
import { MOCK_PINS } from './mock-data';
import fs from 'fs/promises';
import path from 'path';
import { createClient, VercelKV } from '@vercel/kv';

/**
 * Storage interface for Pin data persistence.
 * Implementations: FileStorage (local dev), KVStorage (production)
 */
export interface PinStorage {
    /** Retrieve all pins from storage */
    getAllPins(): Promise<Pin[]>;
    /** Get a single pin by FID, returns null if not found */
    getPin(fid: number): Promise<Pin | null>;
    /** Create a new pin, returns the generated FID */
    createPin(pin: Omit<Pin, 'fid'>): Promise<number>;
    /** Update an existing pin, returns transaction hash */
    updatePin(fid: number, updates: Partial<Pin>): Promise<string>;
}

// 1. FILE SYSTEM STORAGE (Local / Offline)
class FileStorage implements PinStorage {
    private dataFile: string;

    constructor() {
        this.dataFile = path.join(process.cwd(), 'data', 'pins.json');
    }

    private async getStore(): Promise<Record<string, Pin>> {
        try {
            const data = await fs.readFile(this.dataFile, 'utf-8');
            const store = JSON.parse(data);
            // Ensure mocks exist
            Object.values(MOCK_PINS).forEach((pin: Pin) => {
                const key = String(pin.fid);
                if (!store[key]) {
                    store[key] = pin;
                }
            });
            return store;
        } catch (error) {
            const store: Record<string, Pin> = {};
            Object.values(MOCK_PINS).forEach((pin: Pin) => {
                store[String(pin.fid)] = pin;
            });
            await this.saveStore(store);
            return store;
        }
    }

    private async saveStore(store: Record<string, Pin>): Promise<void> {
        // Ensure dir exists
        try {
            await fs.mkdir(path.dirname(this.dataFile), { recursive: true });
        } catch (e) { }
        await fs.writeFile(this.dataFile, JSON.stringify(store, null, 2));
    }

    async getAllPins(): Promise<Pin[]> {
        const store = await this.getStore();
        return Object.values(store);
    }

    async getPin(fid: number): Promise<Pin | null> {
        const store = await this.getStore();
        return store[String(fid)] || null;
    }

    async createPin(pinData: Omit<Pin, 'fid'>): Promise<number> {
        const store = await this.getStore();
        const allFids = Object.keys(store).map(Number);
        const newFid = allFids.length > 0 ? Math.max(...allFids) + 1 : 1000;

        const newPin: Pin = {
            ...pinData,
            fid: newFid,
        };

        store[String(newFid)] = newPin;
        await this.saveStore(store);
        return newFid;
    }

    async updatePin(fid: number, updates: Partial<Pin>): Promise<string> {
        const store = await this.getStore();
        const existing = store[String(fid)];
        if (!existing) throw new Error('Pin not found');

        const updatedPin = {
            ...existing,
            ...updates,
            // @ts-ignore
            widget: updates.widget ? { ...existing.widget, ...updates.widget } : existing.widget,
            lastUpdated: new Date().toISOString()
        };

        store[String(fid)] = updatedPin;
        await this.saveStore(store);
        return '0x' + Math.random().toString(16).slice(2);
    }
}

// 2. VERCEL KV STORAGE (Redis / Production)
class KVStorage implements PinStorage {
    private kv: VercelKV;

    constructor(url: string, token: string) {
        this.kv = createClient({ url, token });
    }

    async getAllPins(): Promise<Pin[]> {
        // Redis scan for pin:* keys to get all
        // Or simpler: Maintain a SET of 'pins' with FIDs
        // For MVP, we will use 'keys pin:*' pattern (slow but fine for <1000 pins)
        const keys = await this.kv.keys('pin:*');
        if (keys.length === 0) return [];

        const pins = await this.kv.mget<Pin[]>(...keys);
        return pins.filter(Boolean) as Pin[];
    }

    async getPin(fid: number): Promise<Pin | null> {
        const key = `pin:${fid}`;
        const pin = await this.kv.get<Pin>(key);
        if (!pin) {
            // Fallback to Mocks if missing in KV
            // @ts-ignore
            const mock = MOCK_PINS[fid] || Object.values(MOCK_PINS).find(p => p.fid === fid);
            if (mock) {
                // Determine if we should cache this mock back to KV? 
                // For safety, let's just return it.
                return mock;
            }
            return null;
        }
        return pin;
    }

    async createPin(pinData: Omit<Pin, 'fid'>): Promise<number> {
        // Simple auto-increment strategy using a counter key
        const newFid = await this.kv.incr('global:next_fid');
        // Initialize counter if first run (ensure > mock IDs)
        if (newFid < 1000) {
            await this.kv.set('global:next_fid', 1000);
            return this.createPin(pinData);
        }

        const newPin: Pin = { ...pinData, fid: newFid };
        await this.kv.set(`pin:${newFid}`, newPin);
        return newFid;
    }

    async updatePin(fid: number, updates: Partial<Pin>): Promise<string> {
        const key = `pin:${fid}`;
        const existing = await this.getPin(fid);

        if (!existing) throw new Error('Pin not found');

        const updatedPin = {
            ...existing,
            ...updates,
            // @ts-ignore
            widget: updates.widget ? { ...existing.widget, ...updates.widget } : existing.widget,
            lastUpdated: new Date().toISOString()
        };

        await this.kv.set(key, updatedPin);
        return '0x' + Math.random().toString(16).slice(2);
    }
}

// FACTORY
function getStorage(): PinStorage {
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    const useKV = !!url && !!token;

    if (useKV) {
        console.log('[Storage] Using Redis (Upstash/Vercel KV)');
        // @ts-ignore
        return new KVStorage(url, token);
    } else {
        console.log('[Storage] Using Local Filesystem (pins.json)');
        return new FileStorage();
    }
}

export const blockchainService = getStorage();
