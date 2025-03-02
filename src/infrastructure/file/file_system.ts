import { PullRequestModel } from "../../domain/model"
import * as fs from "fs/promises"
import path from "path"

/**
 * Interface for file system operations related to progress tracking
 */
export interface FileSystem {
	/**
	 * Read progress data from a file
	 * @param fileName Full path to the progress file
	 * @returns Progress data or null if file doesn't exist
	 */
	readProgress(fileName: string): Promise<{ pullRequests: PullRequestModel[] } | null>
	
	/**
	 * Save progress data to a file
	 * @param progress Progress data to save
	 * @param fileName Full path to the progress file
	 */
	saveProgress(progress: { pullRequests: PullRequestModel[] }, fileName: string): Promise<void>
	
	/**
	 * Generate a filename for progress data
	 * @param date Date string in YYYY-MM-DD format
	 * @param owner Repository owner
	 * @param repo Repository name
	 * @returns Full path to the progress file
	 */
	generateProgressFileName(date: string, owner: string, repo: string): string
}

/**
 * Local file system implementation using Node.js fs/promises
 */
export class LocalFileSystem implements FileSystem {
	private readonly outputDir: string
	
	constructor(outputDir = "output") {
		this.outputDir = outputDir
	}
	
	/**
	 * Generate a standardized filename for progress data
	 * @param date Date string in YYYY-MM-DD format
	 * @param owner Repository owner
	 * @param repo Repository name
	 * @returns Full path to the progress file
	 */
	generateProgressFileName(date: string, owner: string, repo: string): string {
		return path.join(this.outputDir, `${date}-${owner}-${repo}-progress.json`)
	}

	/**
	 * Read progress data from a file
	 * @param fileName Full path to the progress file
	 * @returns Progress data or null if file doesn't exist
	 */
	async readProgress(fileName: string): Promise<{ pullRequests: PullRequestModel[] } | null> {
		try {
			const data = await fs.readFile(fileName, "utf-8")
			return JSON.parse(data)
		} catch (error) {
			// If file doesn't exist, return null instead of throwing
			if (error instanceof Error && 'code' in error && error.code === "ENOENT") {
				return null
			}
			// Re-throw other errors
			throw error
		}
	}

	/**
	 * Save progress data to a file
	 * @param progress Progress data to save
	 * @param fileName Full path to the progress file
	 */
	async saveProgress(progress: { pullRequests: PullRequestModel[] }, fileName: string): Promise<void> {
		// Create directory if it doesn't exist
		await fs.mkdir(path.dirname(fileName), { recursive: true })
		// Write progress data to file
		await fs.writeFile(fileName, JSON.stringify(progress, null, 2), "utf-8")
	}
}
