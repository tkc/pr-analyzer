import { Result } from "neverthrow"
import { PullRequestResponse } from "../domain/model"
import { getPullRequests, getPullRequestDiff as getPRDiffAPI } from "../infrastructure/github_api/github_api_client" // Import functions

export const getOpenPullRequests = async (owner: string, repo: string): Promise<PullRequestResponse[]> => {
	const pullRequests = await getPullRequests(owner, repo)
	return pullRequests.unwrapOr([])
}

export const getPullRequestDiff = async (owner: string, repo: string, pull_number: number): Promise<Result<string, Error>> => {
	const diff = await getPRDiffAPI(owner, repo, pull_number)
	return diff.mapErr((apiError) => apiError as Error)
}
