import { PullRequestModel, GitDiffStat } from "../domain/model"
import { getCodeChangesLines } from "./diff"
import { GitHubAPI } from "../infrastructure/github_api/github_api" // Import GitHubAPI interface

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getOpenPullRequests(
	apiClient: GitHubAPI, // Inject GitHubAPI client
	owner: string,
	repo: string,
): Promise<PullRequestModel[]> {
	try {
		// Fetch PRs for a specific repository using GitHubAPIClient
		const response = await apiClient.getPullRequests(owner, repo)

		const repoPullRequests: PullRequestModel[] = [] // Initialize array to store results

		for (const pr of response.unwrapOr([])) {
			// Unwrap Result and handle errors
			await sleep(500)

			const diffResult = await apiClient.getPullRequestDiff(owner, repo, pr.number) // Use apiClient to fetch diff
			const diffResponse = diffResult.unwrapOr("") // Unwrap Result and use empty string as default
			const codeChanges: GitDiffStat = getCodeChangesLines(diffResponse) // Use getCodeChangesLines to parse diff

			console.log(`PR #${pr.number} - ${pr.title} - ${codeChanges.totalLines} changes`)

			repoPullRequests.push({
				...pr,
				diff: codeChanges,
			}) // Add result to array
		}

		return repoPullRequests
	} catch (error: any) {
		console.error("Error fetching open PRs:", error)
		return []
	}
}
