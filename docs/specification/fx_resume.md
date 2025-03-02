# 設計ドキュメント (designdoc)

## 1. 問題の概要

`updateProgress` 関数が呼び出された際に、中間ファイル (`output/progress.json`) が正しく保存または更新されない。具体的には、`output/progress.json` ファイルは存在するものの、その内容は空の `pullRequests` 配列 (`{"pullRequests": []}`) となっている。

この問題は、`src/index.ts` 内の `main` 関数で `updateProgress` 関数を呼び出す際に、誤った引数（空の配列）を渡していることが原因である。

## 2. 原因の調査

以下の調査を行った。

*   `updateProgress` 関数は `src/service/resume.ts` で定義されていることを確認。
*   `updateProgress` 関数は `src/index.ts` の `main` 関数内で呼び出されていることを確認。
*   `updateProgress` 関数は、`saveProgress` 関数を呼び出して `output/progress.json` に進捗情報を保存することを確認。
*   `output/progress.json` は存在するが、内容は空の `pullRequests` 配列になっていることを確認。
*   `updateProgress` 関数に常に空の配列が渡されていることを確認。

## 3. 解決策

1.  **ファイルシステムアクセスのためのインターフェース定義:**
    *   `src/infrastructure/file_system.ts` を作成し、`FileSystem` インターフェースを定義する。
    *   `FileSystem` インターフェースには、`readProgress`、`saveProgress`、および`deleteProgress`メソッドを定義する。

    ```typescript
    // src/infrastructure/file_system.ts
    import { PullRequestModel } from "../domain/model"
    export interface FileSystem {
      readProgress(): Promise<{ pullRequests: PullRequestModel[] } | null>
      saveProgress(progress: { pullRequests: PullRequestModel[] }): Promise<void>
      deleteProgress(): Promise<void>
    }
    ```

2.  **`src/service/resume.ts` の修正:**
    *   `src/service/resume.ts` の `loadProgress`、`saveProgress`、および`deleteProgress` 関数を、`FileSystem` インターフェースを使用するように変更する。
    *   `resume.ts` は具象クラスに依存してはいけないので、constructorで`FileSystem`インターフェースを引数で受け取るように修正する。

3.  **`src/infrastructure/file_system.ts` に具象クラスの定義**
    *  `FileSystem`インターフェースを実装する、`LocalFileSystem`クラスを定義する。
    *   `LocalFileSystem`クラスに、`deleteProgress`メソッドを実装する。

4.  **テストコードの作成:**
    *   `test/resume.test.ts` を作成し、`FileSystem` インターフェースのインメモリ実装を作成する。
    *   インメモリ実装を使用して、`updateProgress`、`saveProgress`、および`deleteProgress` 関数のテストを記述する。

5. **`src/index.ts`の修正**
    *  `src/index.ts`内で`LocalFileSystem`クラスのインスタンスを作成し、`ResumeService`のコンストラクタに渡すように修正する。
    * `main`関数の最後に`resumeService.deleteProgress()`を呼び出し、`output/progress.json`を削除する。

## 4. テスト

1.  **ユニットテスト:** `src/service/resume.ts` の `updateProgress`、`saveProgress`、および `deleteProgress` 関数に対して、以下のテストケースを含むユニットテストを作成する。
    *   `updateProgress` 関数が、`pullRequests` 配列内のPR情報を正しく更新できること。
    *   `saveProgress` 関数が、与えられたデータを `output/progress.json` に正しく保存できること。
    *   `deleteProgress`関数が、`output/progress.json`を正しく削除できること。
    *   ファイルシステムへのアクセスをモック化し、副作用を排除した状態でテストを行うこと。
2.  **動作確認:** `yarn jest` を実行する。


## 5. 再発防止策

- `src/service/resume.ts`の`updateProgress`関数と`saveProgress`関数にユニットテストを追加する。これにより、将来的な変更で同様の問題が発生することを防ぐ。
- ファイルシステムへのアクセスを抽象化するインターフェース(`FileSystem`)を導入し、テスト時にはインメモリ実装を使用することで、テストの信頼性と保守性を向上させる。
