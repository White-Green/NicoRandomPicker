# NicoRandomPicker（旧版）

この旧版はv2への移行に伴い運用終了予定です。新規の利用・共有は
[NicoRandomPicker v2](https://nicorandompicker.white-green.net/)をご利用ください。
[v2のソースコード](https://github.com/White-Green/nicorandompicker-v2)

## 運用終了前の公開方針

- 配信HTMLの `robots` メタタグに `noindex, follow` を指定し、旧版の検索結果への掲載を抑制します。JavaScriptの実行を待たずに読み取れます。
- 旧版のURLコピー・SNS共有ボタンとURL生成処理を削除し、新しい共有リンクの発行を停止します。既存の共有リンクの読み込み、検索・再生、PR #5のv2移行URLのログ出力は維持します。
- 画面とJavaScript無効時の案内からv2に誘導します。画面のv2リンクは新しいタブで開き、検索設定・結果は引き継ぎません。自動転送は行いません。
- 存在しない `manifest.json` への参照を削除します。

`noindex` を検索エンジンが読み取れるよう、クロールは許可したままにします。
`robots.txt` の `Disallow` で旧版をブロックしないでください。
また、GitHub Pagesのプロジェクトサイトでは `/NicoRandomPicker/robots.txt` を置いても
ホスト直下の `/robots.txt` にはならないため、このリポジトリには追加していません。
`nofollow` は指定せず、v2へのリンクを辿れるようにしています。

## 公開後の確認と運用作業

1. 旧版のトップ、`index.html`、既存の `?data=...` URLの配信HTMLに `noindex, follow` があることを確認します。
2. Search ConsoleのURL検査で旧版の再クロールを依頼し、インデックス除外を確認します。急ぐ場合は一時的な削除申請も併用します。検索結果への反映は再クロール後であり即時ではありません。
3. 管理している紹介ページ・プロフィール・GitHubのAbout/Websiteなどの旧版リンクをv2へ更新します。
4. v2のトップがHTTP 200で、HTMLとHTTPヘッダーに `noindex` がなく、canonicalが `https://nicorandompicker.white-green.net/` を指すことを確認します。v2の `robots.txt` がテキスト、`sitemap.xml` がXMLで配信されることも確認し、Search Consoleへサイトマップを送信します。
5. v2のSearch Consoleで実際のGooglebotからの取得可否も確認します。CloudflareのWAF・ボット設定はリポジトリ外のため、一般のHTTPクライアントで200が返るだけではクローラーの到達性まで保証できません。
6. 完全終了時は保存状態・旧共有リンクの移行を含めて転送方法を決め、旧フロントとAzure APIの停止を別途実施します。

今回の変更は検索・共有による新規流入を減らすためのものです。URLを知っている利用者や
`noindex` に従わないクライアントの直接アクセスを制限するものではありません。

参考: [Googleのnoindexの説明](https://developers.google.com/search/docs/crawling-indexing/block-indexing)、
[robots.txtの配置と書式](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt)

---

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `yarn eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
