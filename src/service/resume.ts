import { PullRequestModel } from "../domain/model"
import { FileSystem } from "../infrastructure/file_system"

export class ResumeService {
	private fileSystem: FileSystem
	private generateProgressFileName: (date: string, owner: string, repo: string) => string

	constructor(fileSystem: FileSystem, generateProgressFileName: (date: string, owner: string, repo: string) => string) {
		this.fileSystem = fileSystem
		this.generateProgressFileName = generateProgressFileName
	}

	/**
	 * progress.jsonから進捗情報を読み込み、パースする
	 * @returns {Promise<PullRequestModel[] | null>} progress.jsonの内容を表すオブジェクト (pullRequests配列)。失敗時はnull
	 */
	async loadProgress(date: string, owner: string, repo: string): Promise<{ pullRequests: PullRequestModel[] } | null> {
		try {
			const fileName = this.generateProgressFileName(date, owner, repo)
			return this.fileSystem.readProgress(fileName)
		} catch (error) {
			console.error("Error loading progress:", error)
			throw error
		}
	}

	/**
	 * 現在の進捗情報をprogress.jsonファイルに書き込む
	 * @param {{ pullRequests: PullRequestModel[] }} progress progress.jsonに保存するデータ (pullRequests配列)
	 */
	async saveProgress(progress: { pullRequests: PullRequestModel[] }, date: string, owner: string, repo: string): Promise<void> {
		try {
			const fileName = this.generateProgressFileName(date, owner, repo)
			await this.fileSystem.saveProgress(progress, fileName)
			console.log("Progress saved.")
		} catch (error) {
			console.error("Error saving progress:", error)
			throw error
		}
	}

	/**
	 * pullRequests配列から、指定されたPRの情報を更新する
	 * @param pullRequests
	 * @param prNumber
	 * @param owner
	 * @param repo
	 * @param diff
	 * @param processed
	 */
	async updateProgress({
		pullRequests,
		number,
		owner,
		repo,
		diff,
		processed,
	}: {
		pullRequests: PullRequestModel[]
		number: number
		owner: string
		repo: string
		diff: any
		processed: boolean
	}): Promise<PullRequestModel[]> {
		const updatedPullRequests: PullRequestModel[] = pullRequests.map((pr) => {
			if (pr.number === number && pr.owner === owner && pr.repo === repo) {
				return {
					...pr,
					diff,
					processed,
				}
			}
			return pr
		})
		const today = new Date()
		const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
		await this.saveProgress({ pullRequests: updatedPullRequests }, date, owner, repo)
		return updatedPullRequests
	}

	async deleteProgress(): Promise<void> {
		// await this.fileSystem.deleteProgress() // 今回は使わない
	}

	async initProgress(pullRequests: PullRequestModel[], date: string, owner: string, repo: string): Promise<PullRequestModel[]> {
		const progress = await this.loadProgress(date, owner, repo)
		if (progress) {
			console.log("Progress file already exists. Skipping creation.")
			return progress.pullRequests
		} else {
			console.log("Creating progress file...")
			await this.saveProgress({ pullRequests }, date, owner, repo)
			return pullRequests
		}
	}
}
