import { Pin } from '@/types';

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
    /** Get a single pin by ID, returns null if not found */
    getPin(id: number): Promise<Pin | null>;
    /** Create a new pin, returns the generated ID */
    createPin(pin: Omit<Pin, 'id'>): Promise<number>;
    /** Update an existing pin, returns transaction hash */
    updatePin(id: number, updates: Partial<Pin>): Promise<string>;
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

            return store;
        } catch (error) {
            const store: Record<string, Pin> = {};

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
        // Robustness: ensure pin.id exists (fallback to key if missing in value)
        return Object.entries(store).map(([key, pin]) => {
            if (!pin.id) {
                return { ...pin, id: key };
            }
            return pin;
        });
    }

    async getPin(id: number): Promise<Pin | null> {
        const store = await this.getStore();
        return store[String(id)] || null;
    }

    async createPin(pinData: Omit<Pin, 'id'>): Promise<number> {
        const store = await this.getStore();
        const allIds = Object.keys(store).map(Number);
        const newId = allIds.length > 0 ? Math.max(...allIds) + 1 : 1000;

        const newPin: Pin = {
            ...pinData,
            id: String(newId), // We store as string in the interface now
        };

        store[String(newId)] = newPin;
        await this.saveStore(store);
        return newId;
    }

    async updatePin(id: number, updates: Partial<Pin>): Promise<string> {
        const store = await this.getStore();
        const existing = store[String(id)];
        if (!existing) throw new Error('Pin not found');

        const updatedPin = {
            ...existing,
            ...updates,
            // @ts-ignore
            widget: updates.widget ? { ...existing.widget, ...updates.widget } : existing.widget,
            lastUpdated: new Date().toISOString()
        };

        store[String(id)] = updatedPin;
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
        // For MVP, we will use 'keys pin:*' pattern (slow but fine for <1000 pins)
        const keys = await this.kv.keys('pin:*');
        if (keys.length === 0) return [];

        const pins = await this.kv.mget<Pin[]>(...keys);
        return pins.filter(Boolean) as Pin[];
    }

    async getPin(id: number): Promise<Pin | null> {
        const key = `pin:${id}`;
        const pin = await this.kv.get<Pin>(key);
        if (!pin) {
            return null;
        }
        return pin;
    }

    async createPin(pinData: Omit<Pin, 'id'>): Promise<number> {
        // Simple auto-increment strategy using a counter key
        const newId = await this.kv.incr('global:next_pin_id');
        // Initialize counter if first run (ensure > mock IDs)
        if (newId < 1000) {
            await this.kv.set('global:next_pin_id', 1000);
            return this.createPin(pinData);
        }

        const newPin: Pin = { ...pinData, id: String(newId) };
        await this.kv.set(`pin:${newId}`, newPin);
        return newId;
    }

    async updatePin(id: number, updates: Partial<Pin>): Promise<string> {
        const key = `pin:${id}`;
        const existing = await this.getPin(id);

        if (!existing) throw new Error('Pin not found');

        const updatedPin = {
            ...existing,
            ...updates,
            widget: updates.widget ? { ...existing.widget || {}, ...updates.widget } as any : existing.widget,
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
