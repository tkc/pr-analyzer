/* @script @tdd */
import { expect, describe, it, jest } from "@jest/globals" // Using jest globals
import { convertArrayToCsv } from "../src/service/csv"
import { PullRequestModel, PullRequestResponse, GitDiffStat } from "../src/domain/model" // Import PullRequestModel, PullRequestResponse, GitDiffStat

describe("convertArrayToCsv", () => {
	it("should return empty string for empty array", () => {
		const data: PullRequestModel[] = []
		const csvOutput = convertArrayToCsv(data) // Unwrap Result and assert empty string - Corrected unwrapOr usage AGAIN
		console.log("Actual CSV Output (empty array):", csvOutput)
		console.log("Expected CSV Output (empty array):", "")
		expect(csvOutput).toBe("") // Assert empty string - Corrected unwrapOr usage AGAIN
	})

	it("should convert single PullRequestModel to CSV", () => {
		const data: PullRequestModel[] = [
			{
				id: 123,
				number: 456,
				title: "Test PR",
				created_at: "2025-03-01T12:00:00Z",
				merged_at: null,
				user: {
					login: "testUser",
					id: 1,
					node_id: "123",
					avatar_url: "testUrl",
					gravatar_id: "gravatar_id",
					url: "url",
					html_url: "html_url",
					followers_url: "followers_url",
					following_url: "following_url",
					gists_url: "gists_url",
					starred_url: "starred_url",
					subscriptions_url: "subscriptions_url",
					organizations_url: "organizations_url",
					repos_url: "repos_url",
					events_url: "events_url",
					received_events_url: "received_events_url",
					type: "User",
					site_admin: false,
				},
				html_url: "testHtmlUrl",
				diff: {
					addedLines: 10,
					deletedLines: 5,
					totalLines: 15,
				} as GitDiffStat,
			},
		] as PullRequestModel[]
		const csvOutput = convertArrayToCsv(data)
		expect(csvOutput).toContain(
			"id,number,title,created_at,merged_at,authorName,avatar_url,url,diff.addedLines,diff.deletedLines,diff.totalLines",
		)
		console.log("Actual CSV Output (single PR):", csvOutput)
		// Check header
		expect(csvOutput).toContain("123,456,Test PR,2025-03-01T12:00:00Z,,testUser,testUrl,testHtmlUrl,10,5,15") // Check content
	})
})
