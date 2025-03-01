// src/github_api/github_api.ts
import { Result } from "neverthrow"
import { GitHubAPIError } from "./github_api_error"
import { PullRequestResponse } from "../../domain/model"

/**
 * Interface for GitHub API client to fetch pull request data.
 * Abstraction for external dependency (GitHub API).
 */
export interface GitHubAPI {
	/**
	 * Fetches all pull requests for a given repository.
	 * @param {string} owner Repository owner (e.g., "facebook")
	 * @param {string} repo Repository name (e.g., "react")
	 * @param {string=} token GitHub Personal Access Token for authentication (optional)
	 * @returns {Promise<Result<PullRequestResponse[], GitHubAPIError>>} Promise resolving to Result containing an array of PullRequestModel on success, or GitHubAPIError on failure.
	 */
	getPullRequests(owner: string, repo: string, token?: string): Promise<Result<PullRequestResponse[], GitHubAPIError>>

	/**
	 * Fetches diff for a specific pull request.
	 * @param {string} owner Repository owner (e.g., "facebook")
	 * @param {string} repo Repository name (e.g., "react")
	 * @param {number} pullRequestNumber Pull request number
	 * @param {string=} token GitHub Personal Access Token for authentication (optional)
	 * @returns {Promise<Result<string, GitHubAPIError>>} Promise resolving to Result containing diff string on success, or GitHubAPIError on failure.
	 */
	getPullRequestDiff(
		owner: string,
		repo: string,
		pullRequestNumber: number,
		token?: string,
	): Promise<Result<string, GitHubAPIError>>
}
