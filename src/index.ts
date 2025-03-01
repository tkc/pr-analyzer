import * as fs from "fs" // Import fs module
import * as dotenv from "dotenv"
import * as yaml from "js-yaml"
import { getOpenPullRequests } from "./service/pr"
import { convertArrayToCsv } from "./service/csv"
import { GitHubAPIClient } from "./infrastructure/github_api/github_api_client" // Corrected import path

dotenv.config()
const repoUrl = process.env.GITHUB_REPO_URL

const gitHubAPIClient: GitHubAPIClient = new GitHubAPIClient() // Create instance of GitHubAPIClient - Moved here

async function main() {
	console.log("Starting the GitHub PRs fetcher...")

	const reposFile = fs.readFileSync("repos.yml", "utf8") // Read repos.yml file // Moved here
	const repos = yaml.load(reposFile) as { repositories: string[] } // Parse YAML content // Moved here

	const startDate = process.env.START_DATE || "2024-01-01"
	const endDate = process.env.END_DATE || "2025-12-31"

	for (const repoUrl of repos.repositories) {
		// Loop through all repos from repos.yml
		const urlParts = repoUrl.split("/")
		const OWNER = urlParts[3] // Moved inside loop
		const REPO = urlParts[4] // Moved inside loop

		const pullRequests = await getOpenPullRequests(gitHubAPIClient, OWNER, REPO, startDate, endDate) // Use getOpenPullRequests service function

		if (!pullRequests || pullRequests.length === 0) {
			console.log(`No pull requests found for ${OWNER}/${REPO}.`)
			continue // Continue to next repo if no PRs found
		}

		// Convert PullRequestModel array to CSV string using convertArrayToCsv service function
		const csvContent = convertArrayToCsv(pullRequests) // Unwrap Result and use empty string as default
		fs.writeFileSync(`output/${REPO}.csv`, csvContent)
		console.log(`CSV file @output/${REPO}.csv generated successfully.`)
	}

	console.log("CSV file 'repo_pr.csv' generated successfully.") // Updated output file name
}

main()
