// src/github_api/github_api_client.ts
import { GitHubAPI } from "./github_api"
import { Result, ok, err } from "neverthrow"
import { GitHubAPIError } from "./github_api_error"
import { PullRequestResponse } from "../../domain/model"
import * as dotenv from "dotenv"
import fetch, { Response, HeadersInit } from "node-fetch"

dotenv.config()
const token = process.env.GITHUB_REPO_URL

/**
 * Implementation of GitHubAPI interface using fetch API.
 * Handles communication with GitHub REST API.
 */

/**
 * Fetches all pull requests for a given repository.
 * @param owner Repository owner.
 * @param repo Repository name.
 * @returns Promise resolving to Result containing an array of PullRequestResponse on success, or GitHubAPIError on failure.
 */
export async function getPullRequests(owner: string, repo: string): Promise<Result<PullRequestResponse[], GitHubAPIError>> {
	let url: string | null = `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=100`
	const allPulls: PullRequestResponse[] = []

	try {
		while (url) {
			console.log(`Fetching URL: ${url}`)
			const response: Response = await fetch(url, {
				headers: {
					Authorization: token ? `Bearer ${token}` : undefined,
					Accept: "application/vnd.github+json",
					"X-GitHub-Api-Version": "2022-11-28",
				} as HeadersInit,
			})

			if (!response.ok) {
				console.error(`HTTP error! status: ${response.status}`, response)
				return err(handleFetchError(response.status, `Error fetching pull requests`)) // response also passed
			}

			const pulls: PullRequestResponse[] = (await response.json()) as PullRequestResponse[]
			allPulls.push(...pulls)
			console.log(`Number of pull requests fetched (page): ${pulls.length}, Cumulative: ${allPulls.length}`)

			const linkHeader: string | null = response.headers.get("Link")
			console.log(`Link Header: ${linkHeader}`)

			if (linkHeader) {
				const links: string[] = linkHeader.split(",")
				let nextUrl: string | null = null
				for (const link of links) {
					if (link.includes('rel="next"')) {
						const nextUrlMatch = link.match(/<([^>]+)>/)
						if (nextUrlMatch && nextUrlMatch[1]) {
							nextUrl = nextUrlMatch[1]
							console.log(`Next URL: ${nextUrl}`)
							break
						}
					}
				}
				url = nextUrl
			} else {
				console.log("No Link header found, end of pagination.")
				url = null
			}
		}
		return ok(allPulls)
	} catch (error: any) {
		return err(handleError(error, "Error fetching pull requests"))
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
		const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${pullRequestNumber}`, {
			headers: {
				Accept: "application/vnd.github.v3.diff",
				Authorization: token ? `token ${token}` : undefined,
			} as HeadersInit,
		})
		if (!response.ok) {
			return err(handleFetchError(response.status, `Error fetching diff for PR #${pullRequestNumber}`))
		}
		const data = await response.text()
		return ok(data)
	} catch (error: any) {
		console.error(error)
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
 * Handles generic errors and returns a GitHubAPIError.
 * @param error The error object.
 * @param message Error message.
 * @returns GitHubAPIError with the error message.
 */
function handleError(error: any, message: string): GitHubAPIError {
	if (error instanceof Error) {
		return { type: "unknown", message: `${message}: ${error.message}` }
	} else {
		return { type: "unknown", message: `${message}: ${String(error)}` }
	}
}
