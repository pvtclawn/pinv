import assert from 'assert';
import { canonicalizeParams, computeParamsHash } from '../lib/params';
import { parseBundle } from '../lib/bundle';

// 1. Canonicalization
console.log('Testing Canonicalization...');
const p1 = { b: '2', a: '1 ', c: 3 };
const bucket1 = canonicalizeParams(p1);
assert.deepStrictEqual(bucket1, { a: '1', b: '2', c: '3' }); // Sorted keys, trimmed values, stringified

const p2 = { a: '1', c: '3', b: '2' };
const bucket2 = canonicalizeParams(p2);
assert.deepStrictEqual(bucket1, bucket2);

const hash1 = computeParamsHash(bucket1);
const hash2 = computeParamsHash(bucket2);
assert.strictEqual(hash1, hash2);
console.log('Canonicalization: PASS');

// 2. Bundle Parsing
console.log('Testing Bundle Parsing...');
const validBundle = { ver: 'QmTest', params: { foo: 'bar' }, ts: 123456 };
const b64 = Buffer.from(JSON.stringify(validBundle)).toString('base64url');
const parsed = parseBundle(b64);
assert.deepStrictEqual(parsed, { ver: 'QmTest', params: { foo: 'bar' }, ts: 123456 });

const invalidB64 = 'not a json';
const parsedInvalid = parseBundle(invalidB64);
assert.strictEqual(parsedInvalid, null);

console.log('Bundle Parsing: PASS');
