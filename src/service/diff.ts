import { GitDiffStat } from "../domain/model"

export function getCodeChangesLines(diff: string): GitDiffStat {
	try {
		console.log("getCodeChangesLines:")
		const lines = diff.split(/\r?\n/)

		const state: GitDiffStat = {
			addedLines: 0,
			deletedLines: 0,
			totalLines: 0,
		}

		for (const line of lines) {
			const trimmedLine = line.replace(/^\s+/, "") // 行頭の空白文字を削除

			if (
				trimmedLine.startsWith("diff --git") ||
				trimmedLine.startsWith("index ") ||
				trimmedLine.startsWith("--- ") ||
				trimmedLine.startsWith("+++ ") ||
				trimmedLine.startsWith("@@ ")
			) {
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
	} catch (error: any) {
		return {
			addedLines: 0,
			deletedLines: 0,
			totalLines: 0,
		}
	}
}
