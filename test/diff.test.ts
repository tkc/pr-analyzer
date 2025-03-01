/* @script @tdd */
import { expect, describe, it } from "@jest/globals" // Using jest globals
import { getCodeChangesLines } from "../src/service/diff"

describe("getCodeChangesLines", () => {
	it("should return 0 lines for empty diff", () => {
		const diff = ""
		const stats = getCodeChangesLines(diff)
		expect(stats.addedLines).toBe(0)
		expect(stats.totalLines).toBe(0) // Updated: Removed deletions assertion
	})

	it("should count additions correctly", () => {
		const diff = `+added line 1\n+added line 2`
		const stats = getCodeChangesLines(diff)
		expect(stats.addedLines).toBe(2)
		expect(stats.totalLines).toBe(2) // Updated: Removed deletions assertion
	})

	it("should count deletions correctly", () => {
		const diff = `-deleted line 1\n-deleted line 2`
		const stats = getCodeChangesLines(diff)
		expect(stats.addedLines).toBe(0)
		expect(stats.totalLines).toBe(2) // Updated: Removed deletions assertion
	})

	it("should count additions and deletions correctly", () => {
		const diff = `+added line\n-deleted line\n+another added line`
		const stats = getCodeChangesLines(diff)
		expect(stats.addedLines).toBe(2)
		expect(stats.totalLines).toBe(3) // Updated: Removed deletions assertion
	})

	it("should ignore git metadata lines", () => {
		const diff = `diff --git a/file.ts b/file.ts\nindex 1234567..abcdefg 100644\n--- a/file.ts\n+++ b/file.ts\n@@ -1,2 +1,2 @@\n+added line\n-deleted line`
		const stats = getCodeChangesLines(diff)
		expect(stats.addedLines).toBe(1)
		expect(stats.totalLines).toBe(2) // Updated: Removed deletions assertion
	})

	it("should ignore empty lines and whitespace", () => {
		const diff = `\n   \n+added line 1\n\t-deleted line 1\n`
		const stats = getCodeChangesLines(diff)
		expect(stats.addedLines).toBe(1)
		expect(stats.totalLines).toBe(2) // Updated: Removed deletions assertion
	})
})
