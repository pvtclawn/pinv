import { ethers } from 'ethers';

export interface PinVBundle {
    ver: string; // Manifest CID
    params?: Record<string, any>; // Custom params
    ts: number; // Timestamp
}

export interface LitAuthResult {
    ok: boolean;
    signer?: string;
    tokenId?: string;
    ver?: string;
    params?: Record<string, any>;
    paramsHash?: string;
    ts?: number;
    handlerCid?: string;
    manifest?: any;
    reason?: string;
}

export interface LitExecResult {
    ok: boolean;
    props?: Record<string, any>;
    reason?: string;
    propsFallback?: Record<string, any>;
}

export interface LitActionResponse {
    response?: string; // JSON string returned by Lit
    logs?: string;
}
