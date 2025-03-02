import { Result, err } from "neverthrow"
import { PullRequestResponse } from "../domain/model"
import { GitHubAPIError } from "../infrastructure/github_api/github_api_error"
import { getPullRequests, getPullRequestDiff as getPRDiffAPI } from "../infrastructure/github_api/github_api_client"

/**
 * Fetch all pull requests for a repository
 * @param owner Repository owner
 * @param repo Repository name
 * @returns Array of pull requests (empty array if error occurs)
 */
export async function getOpenPullRequests(owner: string, repo: string): Promise<PullRequestResponse[]> {
	try {
		const pullRequestsResult = await getPullRequests(owner, repo)
		return pullRequestsResult.unwrapOr([])
	} catch (error) {
		console.error(
			`Error fetching pull requests for ${owner}/${repo}:`, 
			error instanceof Error ? error.message : String(error)
		)
		return []
	}
}

/**
 * Fetch the diff for a specific pull request
 * @param owner Repository owner
 * @param repo Repository name
 * @param pullNumber Pull request number
 * @returns Result containing the diff string or an error
 */
export async function getPullRequestDiff(
	owner: string, 
	repo: string, 
	pullNumber: number
): Promise<Result<string, Error>> {
	try {
		const diffResult = await getPRDiffAPI(owner, repo, pullNumber)
		
		// Convert GitHubAPIError to standard Error for consumers
		return diffResult.mapErr((apiError: GitHubAPIError) => {
			return new Error(`${apiError.type} error: ${apiError.message}`)
		})
	} catch (error) {
		// Handle any unexpected errors
		const errorMessage = error instanceof Error ? error.message : String(error)
		console.error(`Unexpected error fetching diff for PR #${pullNumber}:`, errorMessage)
		return err(new Error(`Failed to fetch diff: ${errorMessage}`))
	}
}
