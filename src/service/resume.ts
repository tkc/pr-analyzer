import { PullRequestModel, GitDiffStat } from "../domain/model"
import { FileSystem } from "../infrastructure/file/file_system"

/**
 * Format a Date object to YYYY-MM-DD string
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, "0")
	const day = String(date.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

/**
 * Interface for progress data structure
 */
export interface ProgressData {
	pullRequests: PullRequestModel[]
}

/**
 * Parameters for updating a pull request's progress
 */
export interface UpdateProgressParams {
	pullRequests: PullRequestModel[]
	number: number
	owner: string
	repo: string
	diff: GitDiffStat | null
	processed: boolean
}

/**
 * Service for managing progress data of pull request processing
 */
export class ResumeService {
	private readonly fileSystem: FileSystem

	/**
	 * Create a new ResumeService
	 * @param fileSystem File system implementation
	 */
	constructor(fileSystem: FileSystem) {
		this.fileSystem = fileSystem
	}

	/**
	 * Load progress data from file
	 * @param date Date string in YYYY-MM-DD format
	 * @param owner Repository owner
	 * @param repo Repository name
	 * @returns Progress data or null if file doesn't exist
	 */
	async loadProgress(date: string, owner: string, repo: string): Promise<ProgressData | null> {
		try {
			const fileName = this.fileSystem.generateProgressFileName(date, owner, repo)
			return this.fileSystem.readProgress(fileName)
		} catch (error) {
			console.error("Error loading progress:", error instanceof Error ? error.message : String(error))
			throw error
		}
	}

	/**
	 * Save progress data to file
	 * @param progress Progress data to save
	 * @param date Date string in YYYY-MM-DD format
	 * @param owner Repository owner
	 * @param repo Repository name
	 */
	async saveProgress(progress: ProgressData, date: string, owner: string, repo: string): Promise<void> {
		try {
			const fileName = this.fileSystem.generateProgressFileName(date, owner, repo)
			await this.fileSystem.saveProgress(progress, fileName)
		} catch (error) {
			console.error("Error saving progress:", error instanceof Error ? error.message : String(error))
			throw error
		}
	}

	/**
	 * Update a specific pull request's progress
	 * @param params Parameters for the update operation
	 * @returns Updated pull requests array
	 */
	async updateProgress({
		pullRequests,
		number,
		owner,
		repo,
		diff,
		processed,
	}: UpdateProgressParams): Promise<PullRequestModel[]> {
		// Update the pull request
		const updatedPullRequests: PullRequestModel[] = pullRequests.map((pr) => {
			if (pr.number === number && pr.owner === owner && pr.repo === repo) {
				return { ...pr, diff, processed }
			}
			return pr
		})
		
		// Save the updated progress
		const today = new Date()
		const date = formatDate(today)
		await this.saveProgress({ pullRequests: updatedPullRequests }, date, owner, repo)
		
		return updatedPullRequests
	}

	/**
	 * Initialize progress tracking for pull requests
	 * @param pullRequests Initial pull requests to track
	 * @param date Date string in YYYY-MM-DD format
	 * @param owner Repository owner
	 * @param repo Repository name
	 * @returns Pull requests from existing progress file or newly initialized pull requests
	 */
	async initProgress(pullRequests: PullRequestModel[], date: string, owner: string, repo: string): Promise<PullRequestModel[]> {
		// Try to load existing progress
		const progress = await this.loadProgress(date, owner, repo)
		
		if (progress) {
			// Use existing progress data
			return progress.pullRequests
		} else {
			// Create new progress file
			await this.saveProgress({ pullRequests }, date, owner, repo)
			return pullRequests
		}
	}
}
