// src/github_api/github_api_error.ts

export class GitHubAPIError extends Error {
	type: "network" | "notFound" | "rateLimitExceeded" | "diffTooLarge" | "unknown"

	constructor(type: "network" | "notFound" | "rateLimitExceeded" | "diffTooLarge" | "unknown", message: string) {
		super(message)
		this.type = type
		this.name = "GitHubAPIError" // Set the name property to identify the error type
	}
}
