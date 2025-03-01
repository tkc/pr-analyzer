// src/github_api/github_api_client.ts
import { GitHubAPI } from "./github_api"
import { Result, ok, err } from "neverthrow" // Corrected import: Removed ResultAsync, okAsync, errAsync
import { GitHubAPIError } from "./github_api_error"
import { PullRequestResponse } from "../../domain/model" // Import PullRequestResponse
import * as dotenv from "dotenv"
import fetch, { Response, HeadersInit } from "node-fetch"

dotenv.config()
const token = process.env.GITHUB_REPO_URL

/**
 * Concrete implementation of GitHubAPI interface using fetch API.
 * Handles communication with GitHub REST API.
 */
export class GitHubAPIClient implements GitHubAPI {
	/**
	 * Fetches all pull requests for a given repository using GitHub API.
	 * @param {string} owner Repository owner (e.g., "facebook")
	 * @param {string} repo Repository name (e.g., "react")
	 * @returns {Promise<Result<PullRequestResponse[], GitHubAPIError>>} Promise resolving to Result containing an array of PullRequestResponse on success, or GitHubAPIError on failure.
	 */
	async getPullRequests(owner: string, repo: string): Promise<Result<PullRequestResponse[], GitHubAPIError>> {
		let url: string | null = `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=100`
		const allPulls: PullRequestResponse[] = []

		try {
			while (url) {
				console.log(`Fetching URL: ${url}`) // デバッグログ：リクエストURL
				const response: Response = await fetch(url, {
					headers: {
						Authorization: token ? `Bearer ${token}` : undefined, // Bearerトークン形式に変更
						Accept: "application/vnd.github+json", // 正しいAcceptヘッダー
						"X-GitHub-Api-Version": "2022-11-28", // APIバージョン指定
					} as HeadersInit,
				})

				if (!response.ok) {
					console.error(`HTTP error! status: ${response.status}`, response) // レスポンス全体をログ出力
					return err(this.handleFetchError(response.status, `Error fetching pull requests`, response)) // response も渡す
				}

				const pulls: PullRequestResponse[] = (await response.json()) as PullRequestResponse[]
				allPulls.push(...pulls)
				console.log(`取得したプルリクエスト数 (ページ): ${pulls.length}, 累積: ${allPulls.length}`) // デバッグログ：ページごとの取得数と累積

				const linkHeader: string | null = response.headers.get("Link")
				console.log(`Link Header: ${linkHeader}`) // デバッグログ：Linkヘッダーの内容

				if (linkHeader) {
					const links: string[] = linkHeader.split(",")
					let nextUrl: string | null = null
					for (const link of links) {
						if (link.includes('rel="next"')) {
							const nextUrlMatch = link.match(/<([^>]+)>/) // 正規表現でURL抽出
							if (nextUrlMatch && nextUrlMatch[1]) {
								nextUrl = nextUrlMatch[1]
								console.log(`Next URL: ${nextUrl}`) // デバッグログ：次のURL
								break
							}
						}
					}
					url = nextUrl
				} else {
					console.log("No Link header found, end of pagination.") // デバッグログ：ページネーション終了
					url = null
				}
			}
			return ok(allPulls)
		} catch (error: any) {
			return err(this.handleError(error, "Error fetching pull requests"))
		}
	}

	/**
	 * Fetches diff for a specific pull request from GitHub API.
	 * @param {string} owner Repository owner (e.g., "facebook")
	 * @param {string} repo Repository name (e.g., "react")
	 * @param {number} pullRequestNumber Pull request number
	 * @returns {Promise<Result<string, GitHubAPIError>>} Promise resolving to Result containing diff string on success, or GitHubAPIError on failure.
	 */
	async getPullRequestDiff(owner: string, repo: string, pullRequestNumber: number): Promise<Result<string, GitHubAPIError>> {
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
