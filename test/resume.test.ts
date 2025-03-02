import { ResumeService } from "../src/service/resume"
import { FileSystem } from "../src/infrastructure/file_system"
import { PullRequestModel } from "../src/domain/model"

const testUser = {
	login: "user1",
	id: 1,
	node_id: "node1",
	avatar_url: "avatar1",
	gravatar_id: "gravatar1",
	url: "url1",
	html_url: "html_url1",
	followers_url: "followers1",
	following_url: "following1",
	gists_url: "gists1",
	starred_url: "starred1",
	subscriptions_url: "subscriptions1",
	organizations_url: "orgs1",
	repos_url: "repos1",
	events_url: "events1",
	received_events_url: "received_events1",
	type: "User",
	site_admin: false,
}

const testPullRequest = {
	id: 1,
	number: 1,
	owner: "owner1",
	repo: "repo1",
	diff: { addedLines: 1, deletedLines: 0, totalLines: 1 },
	processed: false,
	title: "title1",
	created_at: "2024-01-01T00:00:00Z",
	merged_at: "2024-01-01T00:00:00Z",
	user: testUser,
	html_url: "https://example.com/1",
}
class InMemoryFileSystem implements FileSystem {
	private data: { [key: string]: string } = {}

	generateProgressFileName(date: string, owner: string, repo: string): string {
		return `${date}-${owner}-${repo}-progress.json`
	}

	async readProgress(fileName: string): Promise<{ pullRequests: PullRequestModel[] } | null> {
		const content = this.data[fileName]
		if (content) {
			return JSON.parse(content)
		}
		return null
	}

	async saveProgress(progress: { pullRequests: PullRequestModel[] }, fileName: string): Promise<void> {
		this.data[fileName] = JSON.stringify(progress)
	}

	// deleteProgress メソッドはインターフェース上定義されているが、今回は使わない
	async deleteProgress(): Promise<void> {}
}

describe("ResumeService", () => {
	let service: ResumeService
	let fileSystem: InMemoryFileSystem
	const date = "2024-01-01"
	const owner = "owner1"
	const repo = "repo1"

	beforeEach(() => {
		fileSystem = new InMemoryFileSystem()
		service = new ResumeService(fileSystem, (date, owner, repo) => fileSystem.generateProgressFileName(date, owner, repo))
	})

	it("should update progress correctly", async () => {
		const initialPullRequests: PullRequestModel[] = [
			testPullRequest,
			{ ...testPullRequest, id: 2, user: { ...testUser, id: 2 } },
		]
		const fileName = fileSystem.generateProgressFileName(date, owner, repo)
		await service.saveProgress({ pullRequests: initialPullRequests }, date, owner, repo)

		await service.updateProgress({
			pullRequests: initialPullRequests,
			number: 1,
			owner: "owner1",
			repo: "repo1",
			diff: { addedLines: 10, deletedLines: 5, totalLines: 15 },
			processed: true,
		})

		const savedProgress = await service.initProgress(initialPullRequests, date, owner, repo)
		expect(savedProgress).toEqual({
			pullRequests: [
				{
					...testPullRequest,
					diff: { addedLines: 10, deletedLines: 5, totalLines: 15 },
					processed: true,
				},
				{ ...testPullRequest, id: 2, user: { ...testUser, id: 2 } },
			],
		})
	})

	it("should save progress correctly", async () => {
		const pullRequests: PullRequestModel[] = [testPullRequest]
		await service.saveProgress({ pullRequests }, date, owner, repo)

		const savedProgress = await service.initProgress(pullRequests, date, owner, repo)
		expect(savedProgress).toEqual({ pullRequests: [pullRequests] })
	})

	it("should initialize and load progress correctly", async () => {
		const initialPullRequests: PullRequestModel[] = [testPullRequest]

		const fileName = fileSystem.generateProgressFileName(date, owner, repo)

		// 初回はファイルが存在しないため、初期データが保存される
		const firstInit = await service.initProgress(initialPullRequests, date, owner, repo)
		expect(firstInit).toEqual(initialPullRequests)

		// 2回目は保存されたデータが読み込まれる
		const secondInit = await service.initProgress(initialPullRequests, date, owner, repo)
		expect(secondInit).toEqual(initialPullRequests)
	})

	it("should generate file name correctly", () => {
		const fileName = fileSystem.generateProgressFileName(date, owner, repo)
		expect(fileName).toBe("2024-01-01-owner1-repo1-progress.json")
	})
})
