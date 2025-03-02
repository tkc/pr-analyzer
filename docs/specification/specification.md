# 仕様: src/index.ts

## 概要

`src/index.ts` は、GitHub API を利用して特定のリポジトリのプルリクエスト（PR）の差分行数とコミッター情報を取得し、CSV形式で出力するスクリプトです。

## 機能

1. **プルリクエストの取得**:
   - GitHub API (`/repos/{owner}/{repo}/pulls?state=all`) を使用して、指定されたリポジトリ (`mizchi/ailab`) の全てのプルリクエスト（open と closed の両方）を取得します。
   - API リクエストには、環境変数 `GITHUB_TOKEN` が設定されている場合は、認証ヘッダーを含めます。
   - エラー処理には、Result型を導入し、ネットワークエラー、レート制限、リポジトリNotFoundなどのケースを考慮しています。

2. **プルリクエストの差分 (diff) の取得**:
   - 各プルリクエストについて、GitHub API (`/repos/{owner}/{repo}/pulls/{pull_number}`) を使用して、diff を取得します。
   - `Accept: application/vnd.github.v3.diff` ヘッダーを指定して、diff 形式でレスポンスを取得します。
   - 差分取得に失敗した場合も、Result型でエラーを返します (例: 404 Not Found, 406 Diff Too Large)。

3. **差分の解析**:
   - 取得した diff を行単位で解析し、追加行数と削除行数をカウントします。
   - ファイルの種類（コード、ドキュメント、設定ファイル、その他）に応じて、追加・削除行数を分類してカウントします。

4. **結果の出力**:
   - 取得したプルリクエストごとに、以下の情報をCSVに出力します。
   - 以下のモデルを参考にしてください。
```ts
export type PullRequestModel = Pick<
	PullRequestResponse,
	"id" | "number" | "title" | "created_at" | "merged_at" | "user" | "html_url"
> & {
	diff: GitDiffStat
}
```


## 入力

- **リポジトリ情報**:
  - repos.ymlに対象のレポがリストになっています。
- **認証**:
  - `.env`に`GITHUB_TOKEN`の環境変数があります。この値を読み取って利用してください。

## 出力

- repo_pr.csvの名前でcsvファイルとして出力します。
- CSVヘッダーは以下の通りです。
  `PR Number,Title,Committer,コード追加行数,コード削除行数,ドキュメント追加行数,ドキュメント削除行数,設定ファイル追加行数,設定ファイル削除行数,その他ファイル追加行数,その他ファイル削除行数`

## エラー処理

- GitHub API へのリクエストエラーは、Result型で `GitHubAPIError` として返されます。
  - `rateLimitExceeded`: API レート制限超過
  - `notFound`: リポジトリまたはプルリクエストが見つからない
  - `network`: ネットワークエラー
  - `diffTooLarge`: Diff が大きすぎる (406 エラー)
  - `unknown`: その他の不明なエラー

## 依存関係

- `fetch`: HTTP リクエストライブラリ
- `js-yaml`: YAML ファイル読み込みライブラリ
- `neverthrow`: Result型ライブラリ

## 環境変数

- `GITHUB_TOKEN` (オプション): GitHub API の認証に使用する Personal Access Token。

## 実行方法

1.  **コンパイル**:
```bash
$ yarn compile 
```

2.  **テスト**:
```bash
npx jest
```

3.  **実行**:
```bash
$ npx tsx src/index.ts
  ```

## 備考
- 差分の解析は簡易的な実装です。diff 形式の複雑なケースには対応できない場合があります。
- 環境変数 `GITHUB_TOKEN` を設定せずに実行する場合、GitHub API のレート制限に注意してください。
