import { expect, test, describe } from "bun:test";
import { getEditDistance, getSimilarity } from "../../lib/utils/diff";

describe("Diff Utility", () => {
    test("should calculate edit distance correctly", () => {
        expect(getEditDistance("kitten", "sitting")).toBe(3);
        expect(getEditDistance("", "abc")).toBe(3);
        expect(getEditDistance("abc", "")).toBe(3);
        expect(getEditDistance("abc", "abc")).toBe(0);
    });

    test("should calculate similarity score", () => {
        expect(getSimilarity("abc", "abc")).toBe(1.0);
        expect(getSimilarity("abc", "def")).toBe(0.0);
        expect(getSimilarity("kitten", "sitting")).toBeCloseTo(0.57, 1);
    });
});
