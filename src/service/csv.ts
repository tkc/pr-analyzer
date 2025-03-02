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
		"addedLines",
		"deletedLines",
		"totalLines",
	].join(",")

	const rows = data.map((item) => {
		// title をエスケープする処理を追加
		const escapedTitle = item.title.replace(/"/g, '""') // 二重引用符を二重にする
		const quotedTitle = `"${escapedTitle}"` // 二重引用符で囲む
		const diff = item.diff
		const values = [
			item.id,
			item.number,
			quotedTitle,
			item.created_at,
			item.merged_at,
			`"${item.user.login}"`,
			item.user.avatar_url,
			item.html_url,
			...(diff ? [diff.addedLines, diff.deletedLines, diff.totalLines] : ["", "", ""]),
		]
		return values.join(",")
	})

	return [header, ...rows].join("\n")
}
