# 設計ドキュメント (update_resume.md)

## 1. 変更概要
CSVファイルへの出力をやめ、progress.jsonのファイル名を`yyyy-mm-dd-owner-repo-progress.json`の形式に変更し、削除はしないように仕様変更する。

## 2. 変更理由
CSV出力が不要になったため。進捗ファイルはリポジトリ、日付ごとに管理し、削除はしない方針になったため。

## 3. 解決策

1.  **ファイル名の変更:**
    *   `src/infrastructure/file_system.ts`内の`PROGRESS_FILE`定数を、日付、オーナー、リポジトリ名を含む動的なファイル名に変更する。
    *   ファイル名の生成ロジックを`src/infrastructure/file_system.ts`内の`LocalFileSystem`クラスの`generateProgressFileName`メソッドにカプセル化する。
        *   `generateProgressFileName`メソッドは、現在時刻(`Date`オブジェクトを使用)から日付(`yyyy-mm-dd`)、オーナー、リポジトリ名を使ってファイル名を生成する。
        *   `src/index.ts`から`LocalFileSystem`をインスタンス化する際に、このファイル名生成関数を`ResumeService`のコンストラクタに渡す。

2.  **`src/index.ts`の修正:**
    *   CSVファイルへの出力に関する記述(`convertArrayToCsv`関数の呼び出し、`fs.writeFileSync`による書き込み)を削除する。
    *   `resumeService.deleteProgress()`の呼び出しを削除する。
    *   `initProgress`と`updateProgress`呼び出し時に、日付、オーナー、リポジトリ名を渡すように修正する。

3.  **`src/service/resume.ts`の修正:**
     * `ResumeService`クラスのコンストラクタで、ファイル名生成関数を引数として受け取るように変更する。
     *  `loadProgress`と`saveProgress`メソッドで、ファイル名生成関数を使用してファイル名を生成するように変更する。

4.  **テストコードの修正:**
    *   `test/resume.test.ts`内の`InMemoryFileSystem`クラスに、ファイル名生成ロジックを模倣した処理を追加する。
    *   テストケースで、ファイル名が正しく生成されること、およびファイルが削除されないことを確認する。

## 4. テスト

1.  **ユニットテスト:** `src/service/resume.ts`の`loadProgress`、`saveProgress`関数に対して、以下のテストケースを含むユニットテストを作成・更新する。
    *   ファイル名が`yyyy-mm-dd-owner-repo-progress.json`の形式で正しく生成されること。
    *   `saveProgress`関数が、与えられたデータを指定されたファイル名で正しく保存できること。
    *   `loadProgress` 関数が、指定されたファイル名から進捗情報を正しく読み込めること。
    *   ファイルシステムへのアクセスをモック化し、副作用を排除した状態でテストを行うこと。
    *   `deleteProgress`関連のテストは削除する。
2.  **動作確認:** `yarn jest`を実行する。

## 5. 再発防止策
- ファイルシステムへのアクセスを抽象化するインターフェース(`FileSystem`)を導入し、テスト時にはインメモリ実装を使用することで、テストの信頼性と保守性を向上させる。（変更なし）
- ファイル名生成ロジックの単体テストを作成し、ファイル名が意図した通りに生成されることを保証する。

## 6. テストエラーと修正

### 現状

`yarn compile` を実行すると、`test/resume.test.ts` で以下のエラーが発生する。

```
test/resume.test.ts:80:17 - error TS2554: Expected 4 arguments, but got 2.

80   await service.saveProgress({ pullRequests: initialPullRequests }, fileName)
                   ~~~~~~~~~~~~

  src/service/resume.ts:31:83
    31  async saveProgress(progress: { pullRequests: PullRequestModel[] }, date: string, owner: string, repo: string): Promise<void> {
                                                                                         ~~~~~~~~~~~~~
    An argument for 'owner' was not provided.

test/resume.test.ts:91:4 - error TS2554: Expected 1 arguments, but got 4.

91    date,
      ~~~~~
92    owner,
   ~~~~~~~~~
93    repo,
   ~~~~~~~

test/resume.test.ts:97:39 - error TS2554: Expected 3 arguments, but got 1.

97   const savedProgress = await service.loadProgress(savedProgressFileName)
                                         ~~~~~~~~~~~~

  src/service/resume.ts:17:35
    17  async loadProgress(date: string, owner: string, repo: string): Promise<{ pullRequests: PullRequestModel[] } | null> {
                                         ~~~~~~~~~~~~~
    An argument for 'owner' was not provided.

test/resume.test.ts:113:17 - error TS2554: Expected 4 arguments, but got 2.

113   await service.saveProgress({ pullRequests }, fileName)
                    ~~~~~~~~~~~~

  src/service/resume.ts:31:83
    31  async saveProgress(progress: { pullRequests: PullRequestModel[] }, date: string, owner: string, repo: string): Promise<void> {
                                                                                         ~~~~~~~~~~~~~
    An argument for 'owner' was not provided.

test/resume.test.ts:116:39 - error TS2554: Expected 3 arguments, but got 1.

116   const savedProgress = await service.loadProgress(savedProgressFileName)
                                          ~~~~~~~~~~~~

  src/service/resume.ts:17:35
    17  async loadProgress(date: string, owner: string, repo: string): Promise<{ pullRequests: PullRequestModel[] } | null> {
                                         ~~~~~~~~~~~~~
    An argument for 'owner' was not provided.


Found 5 errors in the same file, starting at: test/resume.test.ts:80
```

### 原因

`src/service/resume.ts` の `saveProgress`、`loadProgress`、および`updateProgress` メソッドの定義と、`test/resume.test.ts` での呼び出し方で、引数の数が一致していない。

- `saveProgress` は `progress` オブジェクトと `fileName` 文字列の2つの引数を取る
- `loadProgress` は `fileName` 文字列の1つの引数を取る
- `updateProgress`は、更新情報を含むオブジェクト1つを引数に取る。

にもかかわらず、`test/resume.test.ts` では、

- `saveProgress` を呼び出す際に `progress` オブジェクトだけでなく、`date`, `owner`, `repo` も渡している
- `loadProgress` を呼び出す際に `fileName` だけでなく、`date`, `owner`, `repo` を渡そうとしている
- `updateProgress`を呼び出す際に、更新情報オブジェクトだけでなく、`date`, `owner`, `repo`を আলাদা আলাদাভাবে渡している。

### 修正方法

`test/resume.test.ts` 内で以下のように修正する。

- `saveProgress` の呼び出し:

```typescript
// 修正前
await service.saveProgress({ pullRequests: initialPullRequests }, date, owner, repo);

// 修正後
const fileName = fileSystem.generateProgressFileName(date, owner, repo)
await service.saveProgress({ pullRequests: initialPullRequests }, fileName)
```

- `loadProgress` の呼び出し:

```typescript
// 修正前
const savedProgress = await service.loadProgress(date, owner, repo)

// 修正後
const savedProgressFileName = fileSystem.generateProgressFileName(date, owner, repo)
const savedProgress = await service.loadProgress(savedProgressFileName)
```

- `updateProgress`の呼び出し：

```typescript
//修正前
await service.updateProgress(
  {
    pullRequests: initialPullRequests,
    number: 1,
    owner: "owner1",
    repo: "repo1",
    diff: { addedLines: 10, deletedLines: 5, totalLines: 15 },
    processed: true,
  },
  date,
  owner,
  repo
);

//修正後
await service.updateProgress({
  pullRequests: initialPullRequests,
  number: 1,
  owner: "owner1",
  repo: "repo1",
  diff: { addedLines: 10, deletedLines: 5, totalLines: 15 },
  processed: true,
});
```

- また、`should update progress correctly`テストの期待値を以下のように修正する。

```typescript
// 修正前
expect(updatedPullRequests).toEqual([
  {
    ...testPullRequest,
    diff: { addedLines: 10, deletedLines: 5, totalLines: 15 },
    processed: true,
  },
  { ...testPullRequest, id: 2, user: { ...testUser, id: 2 } },
]);

// 修正後
expect(savedProgress).toEqual({
  pullRequests: [
    {
      ...testPullRequest,
      diff: { addedLines: 10, deletedLines: 5, totalLines: 15 },
      processed: true,
    },
    { ...testPullRequest, id: 2, user: { ...testUser, id: 2 } },
  ],
});
```

この修正により、各メソッドに正しい引数が渡され、`updateProgress`のテストが`saveProgress`で保存された内容を正しく検証するようになる。
