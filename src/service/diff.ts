import { GitDiffStat } from "../domain/model"

// Git diff metadata line prefixes to ignore
const GIT_METADATA_PATTERNS = [
	"diff --git",
	"index ",
	"--- ",
	"+++ ",
	"@@ ",
]

/**
 * Parses a Git diff string and returns statistics about line changes
 * @param diff The git diff text to analyze
 * @returns Statistics about added/deleted/total changed lines
 */
export function getCodeChangesLines(diff: string): GitDiffStat {
	try {
		if (!diff) {
			return createEmptyDiffStat()
		}

		const lines = diff.split(/\r?\n/)
		const state: GitDiffStat = createEmptyDiffStat()

		for (const line of lines) {
			const trimmedLine = line.replace(/^\s+/, "") // Remove leading whitespace
			
			// Skip git metadata lines
			if (GIT_METADATA_PATTERNS.some(pattern => trimmedLine.startsWith(pattern))) {
				continue
			}

			if (trimmedLine.startsWith("+")) {
				state.addedLines++
				state.totalLines++
			} else if (trimmedLine.startsWith("-")) {
				state.deletedLines++
				state.totalLines++
			}
		}
		
		return state
	} catch (error) {
		// Log error but return empty stats object to prevent disrupting analysis
		console.error("Error parsing diff:", error instanceof Error ? error.message : String(error))
		return createEmptyDiffStat()
	}
}

/**
 * Creates an empty diff statistics object
 */
function createEmptyDiffStat(): GitDiffStat {
	return {
		addedLines: 0,
		deletedLines: 0,
		totalLines: 0,
	}
}
