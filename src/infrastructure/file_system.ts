import { PullRequestModel } from "../domain/model"
import * as fs from "fs/promises"
import path from "path"

export interface FileSystem {
	readProgress(fileName: string): Promise<{ pullRequests: PullRequestModel[] } | null>
	saveProgress(progress: { pullRequests: PullRequestModel[] }, fileName: string): Promise<void>
	deleteProgress(): Promise<void> // 今回は使わないが、インターフェース上定義されているので残す。
}

export class LocalFileSystem implements FileSystem {
	generateProgressFileName(date: string, owner: string, repo: string): string {
		return path.join("output", `${date}-${owner}-${repo}-progress.json`)
	}

	async readProgress(fileName: string): Promise<{ pullRequests: PullRequestModel[] } | null> {
		try {
			const data = await fs.readFile(fileName, "utf-8")
			return JSON.parse(data)
		} catch (error: any) {
			if (error.code === "ENOENT") {
				return null
			}
			throw error
		}
	}

	async saveProgress(progress: { pullRequests: PullRequestModel[] }, fileName: string): Promise<void> {
		await fs.mkdir(path.dirname(fileName), { recursive: true })
		await fs.writeFile(fileName, JSON.stringify(progress, null, 2), "utf-8")
	}
	async deleteProgress(): Promise<void> {
		// 今回は使わない
	}
}
