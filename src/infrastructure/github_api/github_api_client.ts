// src/github_api/github_api_client.ts
import { GitHubAPI } from "./github_api"
import { Result, ok, err } from "neverthrow" // Corrected import: Removed ResultAsync, okAsync, errAsync
import { GitHubAPIError } from "./github_api_error"
import { PullRequestResponse } from "../../domain/model" // Import PullRequestResponse

/**
 * Concrete implementation of GitHubAPI interface using fetch API.
 * Handles communication with GitHub REST API.
 */
export class GitHubAPIClient implements GitHubAPI {
	/**
	 * Fetches all pull requests for a given repository using GitHub API.
	 * @param {string} owner Repository owner (e.g., "facebook")
	 * @param {string} repo Repository name (e.g., "react")
	 * @param {string} token GitHub Personal Access Token for authentication (optional)
	 * @returns {Promise<Result<PullRequestResponse[], GitHubAPIError>>} Promise resolving to Result containing an array of PullRequestResponse on success, or GitHubAPIError on failure.
	 */
	async getPullRequests(owner: string, repo: string, token?: string): Promise<Result<PullRequestResponse[], GitHubAPIError>> {
		// Corrected return type to Result
		// Return Result
		try {
			const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=all`, {
				headers: {
					// Headers as plain object literal with explicit casting to HeadersInit
					Authorization: token ? `token ${token}` : undefined,
					Accept: "application/json",
				} as HeadersInit, // Explicitly cast to HeadersInit
			})
			if (!response.ok) {
				return err(this.handleFetchError(response.status, "Error fetching pull requests")) // Use err
			}
			const data = await response.json()
			return ok(data as PullRequestResponse[]) // Return ok with PullRequestResponse[]
		} catch (error: any) {
			return err(this.handleError(error, "Error fetching pull requests")) // Use err
		}
	}

	/**
	 * Fetches diff for a specific pull request from GitHub API.
	 * @param {string} owner Repository owner (e.g., "facebook")
	 * @param {string} repo Repository name (e.g., "react")
	 * @param {number} pullRequestNumber Pull request number
	 * @param {string} token GitHub Personal Access Token for authentication (optional)
	 * @returns {Promise<Result<string, GitHubAPIError>>} Promise resolving to Result containing diff string on success, or GitHubAPIError on failure.
	 */
	async getPullRequestDiff(
		owner: string,
		repo: string,
		pullRequestNumber: number,
		token?: string,
	): Promise<Result<string, GitHubAPIError>> {
		try {
			const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullRequestNumber}`, {
				headers: {
					// Headers as plain object literal with explicit casting to HeadersInit
					Accept: "application/vnd.github.v3.diff",
					Authorization: token ? `token ${token}` : undefined,
				} as HeadersInit, // Explicitly cast to HeadersInit
			})
			if (!response.ok) {
				return err(this.handleFetchError(response.status, `Error fetching diff for PR #${pullRequestNumber}`))
			}
			const data = await response.text()
			return ok(data)
		} catch (error: any) {
			console.error(error)
			return err(this.handleError(error, `Error fetching diff for PR #${pullRequestNumber}`))
		}
	}

	/**
	 * Handles fetch errors and returns specific GitHubAPIError based on status code.
	 * @private
	 * @param {number} status HTTP status code of the response
	 * @param {string} message Error message to include in GitHubAPIError
	 * @returns {GitHubAPIError} GitHubAPIError corresponding to the status code.
	 */
	private handleFetchError(status: number, message: string): GitHubAPIError {
		switch (status) {
			case 403:
				return { type: "rateLimitExceeded", message: "GitHub API rate limit exceeded" }
			case 404:
				return { type: "notFound", message: "Resource not found" }
			case 406:
				return { type: "diffTooLarge", message: "Pull request diff is too large" }
			default:
				return { type: "network", message: `${message}: HTTP status ${status}` }
		}
	}

	/**
	 * Handles generic errors and returns a GitHubAPIError of type 'unknown'.
	 * @private
	 * @param {*} error Generic error object
	 * @param {string} message Error message to include in GitHubAPIError
	 * @returns {GitHubAPIError} GitHubAPIError of type 'unknown' with the error message.
	 */
	private handleError(error: any, message: string): GitHubAPIError {
		return { type: "unknown", message: `${message}: ${error.message}` }
	}
}
