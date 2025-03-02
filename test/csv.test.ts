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
		console.log("Actual CSV Output (single PR):", csvOutput)
		// ヘッダーとデータ行を別々に検証する
		const [header, dataRow] = csvOutput.split("\n")
		expect(header).toBe("id,number,title,created_at,merged_at,authorName,avatar_url,url,addedLines,deletedLines,totalLines")

		const values = dataRow.split(",")
		expect(values[0]).toBe("123") // id
		expect(values[1]).toBe("456") // number
		expect(values[2]).toBe('"Test PR"') // title
		expect(values[3]).toBe("2025-03-01T12:00:00Z") // created_at
		expect(values[4]).toBe("") // merged_at
		expect(values[5]).toBe(`"testUser"`) // authorName
		expect(values[6]).toBe("testUrl") // avatar_url
		expect(values[7]).toBe("testHtmlUrl") // url
		expect(values[8]).toBe("10") // diff.addedLines
		expect(values[9]).toBe("5") // diff.deletedLines
		expect(values[10]).toBe("15") // diff.totalLines
	})
})
