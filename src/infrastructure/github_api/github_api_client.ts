// src/infrastructure/github_api/github_api_client.ts
import { GitHubAPI } from "./github_api"
import { Result, ok, err } from "neverthrow"
import { GitHubAPIError } from "./github_api_error"
import { PullRequestResponse } from "../../domain/model"
import * as dotenv from "dotenv"
import fetch, { Response, HeadersInit } from "node-fetch"

// Load environment variables
dotenv.config()
const token = process.env.GITHUB_TOKEN

// API Constants
const GITHUB_API_BASE = "https://api.github.com"
const GITHUB_API_VERSION = "2022-11-28"
const DEFAULT_PAGE_SIZE = 100

/**
 * Implementation of GitHubAPI interface using fetch API.
 * Handles communication with GitHub REST API.
 */

/**
 * Extracts the next URL from a GitHub API Link header
 * @param linkHeader The Link header from GitHub API response
 * @returns The next URL or null if there is no next page
 */
function extractNextUrl(linkHeader: string | null): string | null {
	if (!linkHeader) {
		return null
	}
	
	const links = linkHeader.split(",")
	for (const link of links) {
		if (link.includes('rel="next"')) {
			const nextUrlMatch = link.match(/<([^>]+)>/)
			if (nextUrlMatch && nextUrlMatch[1]) {
				return nextUrlMatch[1]
			}
		}
	}
	return null
}

/**
 * Creates standard headers for GitHub API requests
 * @param acceptType The Accept header value
 * @returns Headers object for fetch
 */
function createGitHubHeaders(acceptType = "application/vnd.github+json"): HeadersInit {
	return {
		Authorization: token ? `Bearer ${token}` : undefined,
		Accept: acceptType,
		"X-GitHub-Api-Version": GITHUB_API_VERSION,
	} as HeadersInit
}

/**
 * Fetches all pull requests for a given repository.
 * @param owner Repository owner.
 * @param repo Repository name.
 * @returns Promise resolving to Result containing an array of PullRequestResponse on success, or GitHubAPIError on failure.
 */
export async function getPullRequests(owner: string, repo: string): Promise<Result<PullRequestResponse[], GitHubAPIError>> {
	let url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls?state=all&per_page=${DEFAULT_PAGE_SIZE}`
	const allPulls: PullRequestResponse[] = []

	try {
		while (url) {
			const response: Response = await fetch(url, {
				headers: createGitHubHeaders()
			})

			if (!response.ok) {
				return err(handleFetchError(response.status, `Error fetching pull requests for ${owner}/${repo}`))
			}

			const pulls: PullRequestResponse[] = (await response.json()) as PullRequestResponse[]
			allPulls.push(...pulls)
			
			// Get next page URL from Link header
			url = extractNextUrl(response.headers.get("Link")) || ""
		}
		return ok(allPulls)
	} catch (error) {
		return err(handleError(error, `Error fetching pull requests for ${owner}/${repo}`))
	}
}

/**
 * Fetches diff for a specific pull request.
 * @param owner Repository owner.
 * @param repo Repository name.
 * @param pullRequestNumber Pull request number.
 * @returns Promise resolving to Result containing diff string on success, or GitHubAPIError on failure.
 */
export async function getPullRequestDiff(
	owner: string,
	repo: string,
	pullRequestNumber: number,
): Promise<Result<string, GitHubAPIError>> {
	try {
		const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${pullRequestNumber}`
		const response = await fetch(url, {
			headers: createGitHubHeaders("application/vnd.github.v3.diff")
		})
		
		if (!response.ok) {
			return err(handleFetchError(response.status, `Error fetching diff for PR #${pullRequestNumber}`))
		}
		
		const data = await response.text()
		return ok(data)
	} catch (error) {
		return err(handleError(error, `Error fetching diff for PR #${pullRequestNumber}`))
	}
}

/**
 * Handles fetch errors and returns specific GitHubAPIError based on status code.
 * @param status HTTP status code of the response.
 * @param message Error message.
 * @returns GitHubAPIError corresponding to the status code.
 */
function handleFetchError(status: number, message: string): GitHubAPIError {
	switch (status) {
		case 403:
			return new GitHubAPIError("rateLimitExceeded", "GitHub API rate limit exceeded")
		case 404:
			return new GitHubAPIError("notFound", "Resource not found")
		case 406:
			return new GitHubAPIError("diffTooLarge", "Pull request diff is too large")
		default:
			return new GitHubAPIError("network", `${message}: HTTP status ${status}`)
	}
}

/**
 * Handles generic errors and returns a GitHubAPIError.
 * @param error The error object.
 * @param message Error message.
 * @returns GitHubAPIError with the error message.
 */
function handleError(error: unknown, message: string): GitHubAPIError {
	if (error instanceof Error) {
		return new GitHubAPIError("unknown", `${message}: ${error.message}`)
	} else {
		return new GitHubAPIError("unknown", `${message}: ${String(error)}`)
	}
}
