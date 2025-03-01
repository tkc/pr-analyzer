import { PullRequestModel } from "../domain/model"

export function convertArrayToCsv(data: PullRequestModel[]): string {
	if (data.length === 0) {
		return "" // データが空の場合は空文字列を返す
	}

	const header = [
		"id",
		"number",
		"title",
		"created_at",
		"merged_at",
		"authorName",
		"avatar_url",
		"url",
		"diff.addedLines",
		"diff.deletedLines",
		"diff.totalLines",
	].join(",")

	const rows = data.map((item) => {
		const values = [
			item.id,
			item.number,
			item.title,
			item.created_at,
			item.merged_at,
			item.user.login,
			item.user.avatar_url,
			item.html_url,
			item.diff.addedLines,
			item.diff.deletedLines,
			item.diff.totalLines,
		]
		return values.join(",")
	})

	return [header, ...rows].join("\n")
}
