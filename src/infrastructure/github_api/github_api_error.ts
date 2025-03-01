// src/github_api/github_api_error.ts

/**
 * Type definition for GitHub API errors.
 * Discriminated union type to represent various API error scenarios.
 */
export type GitHubAPIError =
	| { type: "network"; message: string }
	| { type: "notFound"; message: string }
	| { type: "rateLimitExceeded"; message: string }
	| { type: "diffTooLarge"; message: string }
	| { type: "unknown"; message: string }
