import * as fs from "fs"
import * as yaml from "js-yaml"
import { getOpenPullRequests, getPullRequestDiff } from "./service/pr"
import { getCodeChangesLines } from "./service/diff"
import { ResumeService } from "./service/resume"
import { LocalFileSystem } from "./infrastructure/file/file_system"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
	console.log("Starting the GitHub PRs fetcher...")

	const reposFile = fs.readFileSync("repos.yml", "utf8")
	const repos = yaml.load(reposFile) as { repositories: string[] }

	const today = new Date()
	const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(
		2,
		"0",
	)}`

	for (const repoUrl of repos.repositories) {
		const urlParts = repoUrl.split("/")
		const OWNER = urlParts[3]
		const REPO = urlParts[4]

		const pullRequests = await getOpenPullRequests(OWNER, REPO)

		if (!pullRequests || pullRequests.length === 0) {
			console.log(`No pull requests found for ${OWNER}/${REPO}.`)
			continue
		}

		const fileSystem = new LocalFileSystem()
		const resumeService = new ResumeService(fileSystem, fileSystem.generateProgressFileName)

		// Create or update progress with the new PRs
		let progress = await resumeService.initProgress(
			pullRequests.map((pr) => ({
				id: pr.id,
				number: pr.number,
				owner: OWNER,
				repo: REPO,
				title: pr.title,
				created_at: pr.created_at,
				merged_at: pr.merged_at,
				user: pr.user,
				html_url: pr.html_url,
				diff: null, // 今回はdiffの取得は不要
				processed: false,
			})),
			date,
			OWNER,
			REPO,
		)

		for (const pr of pullRequests) {
			if (progress.find((p) => p.number === pr.number && p.owner === OWNER && p.repo === REPO && p.processed)) {
				console.log(`Skipping processed PR #${pr.number} for ${OWNER}/${REPO}...`)
				continue
			}

			const diffResult = await getPullRequestDiff(OWNER, REPO, pr.number)
			const diffResponse = diffResult.unwrapOr("") // Unwrap Result and use empty string as default
			const codeChanges = getCodeChangesLines(diffResponse) // Use getCodeChangesLines to parse diff

			console.log(`PR #${pr.number} - ${pr.title} - ${codeChanges.totalLines} changes`)

			// Update progress with the diff info and mark as processed
			progress = await resumeService.updateProgress({
				pullRequests: progress || [],
				number: pr.number,
				owner: OWNER,
				repo: REPO,
				diff: codeChanges, // 今回はdiffの取得は不要
				processed: true,
			})
			sleep(500)
		}
	}
}

main()
