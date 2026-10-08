# 2026年10月 Power Apps アップデートまとめ

> 調査期間：2026年9月〜10月初旬  
> 作成日：2026年10月8日

---

## Power Platform 関連

### Power Apps の主な変更

- ⭐ **モデル駆動型アプリのUIリフレッシュがGA（一般提供）**: 更新されたヘッダー・ナビゲーション体験が正式に一般提供開始。Fluent 2デザインシステムに基づいた新しい外観がデフォルトに
  - [参考: Microsoft Power Platform Blog - September 2026](https://www.microsoft.com/en-us/power-platform/blog/power-apps/whats-new-in-power-platform-september-2026-feature-update/)
- ⭐ **表示密度（Display Density）のプレビュー公開**: モデル駆動型アプリでComfortable（広め）、Cozy（標準）、Compact（コンパクト）の3段階表示密度を選択可能
- ⭐ **ジェネレーティブページのフォーム組み込み対応**: ジェネレーティブページをモデル駆動型アプリのフォーム内のセクションまたはタブに直接追加可能に
- ⭐ **Dataverse以外のコネクタ対応（プレビュー）**: ジェネレーティブページがPower Platformコネクタエコシステム経由でDataverse以外のデータにアクセス可能
- **キャンバスアプリ向けスクリーンテンプレート追加**: Fluent 2ベースの新テンプレートが6種類追加（合計9種類に）。データ接続とカスタマイズが容易
- **コントロール一括アップデート機能**: 画面上の対象コントロールをまとめてモダン版に更新可能。更新後はフォーミュラの確認が必要（プロパティ名や動作が変更される場合あり）
- **新しいモダンコントロール**: プログレスバー、モダンアバター、スピナーコントロールの追加
- **名前付き数式（Named Formulas）のGA**: キャンバスアプリでの名前付き数式が一般提供に
- **DataverseオンラインモードのGA**: キャンバスアプリからDataverseへのオンラインモードアクセスが一般提供
- **モバイル向けモダンルック（プレビュー）**: モデル駆動型アプリのモバイル版でも更新UIが利用可能に（プレビュー）
- **メールアプリのFluentリフレッシュ（10月展開予定）**: モデル駆動型アプリ内メールアプリが半期チャネル向けに10月更新でFluentデザインに刷新予定
  - [参考: Windows Forum](https://windowsforum.com/news/power-apps-mail-app-gets-fluent-refresh-for-semiannual-channel-in-october-2026.447451/)
- **AIコード生成ツールによるモデル駆動型アプリの構築・編集（プレビュー）**: AI支援でモデル駆動型アプリの構築・編集が可能

### Dataverse の主な変更

- ⭐ **削除済みレコードの復元機能**: 削除されたレコードを最大30日間（設定可能）保持・復元可能に
- **Fabric向け初回同期のガイド付きテーブル選択**: Microsoft Fabricとの初回同期時に必要なテーブルを事前選択可能。全テーブル同期の回避が容易に
  - [参考: Dynamics Communities](https://dynamicscommunities.com/ug/power-platform-ug/power-platform-2026-release-wave-1-dataverse/)
- **AIプロンプト列**: AIプロンプトを使ったデータ品質向上のためのプロンプト列機能
- **Dataverse管理MCPサーバー**: AIツールをDataverseデータと機能に適用するための管理MCPサーバー
- **Business CentralとのDataverseフィールドマッピング改善**: テーブル拡張なしに新しいDataverseフィールドをBusiness Centralにマッピング可能（2026年9月30日）

### Power Automate の主な変更

- ⭐ **クラウドフローのエージェントループ実行（Wave 2予定）**: フローが継続・停止を自律的に判断しながらエージェントループで動作する機能
- **ホームページにクイックスタートカード追加**: 一般的な自動化シナリオへの入りやすいエントリーポイントを提供
  - [参考: Microsoft Power Platform Blog - September 2026](https://www.microsoft.com/en-us/power-platform/blog/power-apps/whats-new-in-power-platform-september-2026-feature-update/)
- **マイフローのサーバーサイド検索**: ブラウザにロード済みのフローだけでなく、環境全体のフローからサービス側で検索可能
- **プロセスマイニングのGA（Wave 2予定）**: オブジェクト中心のプロセスマイニングが一般提供予定
- **デスクトップフローの自己修復機能**: AI駆動の最適化と自己修復能力（Wave 1）
- **Copilot Studioアクション連携**: クラウドフロー内でCopilot Studio搭載のアクションが利用可能

### Power BI の主な変更

- ⭐ **Copilot NotebooksでPower BIレポートの参照が可能（9月末プレビュー→10月GA）**: Microsoft 365 Copilot Notebooksの参照としてPower BIレポートを追加可能
  - [参考: MC1474458](https://mc.merill.net/message/MC1474458)
- **モダンビジュアルデフォルトとテーマペインのGA**: 新しいデフォルトビジュアルスタイルとテーマペインが一般提供（8月）
- **日付ピッカースライサーで単一日付選択をサポート**
- **OneLakeイメージURLのビジュアル対応**
- **モバイルアプリからExcelへのデータエクスポート対応**
- **Power BI Desktopの古いファイルピッカー廃止予定（10月以降）**: 2026年3月以前のバージョンではOneDrive/SharePointへのファイル保存・共有が不可に
- **Q&A機能の廃止予定**: 2026年12月に廃止予定
  - [参考: Power BI September 2026 Feature Summary](https://community.fabric.microsoft.com/blog/fbc_pbiupdatesblog/power-bi-september-2026-feature-summary/5325831)

### Power Pages の主な変更

- ⭐ **Modern ListのGA**: Fluent UIコンポーネント、無限スクロール、インラインフィルタリング、カスタムJavaScript対応の新データ表示体験が一般提供
  - [参考: Microsoft Power Platform Blog](https://www.microsoft.com/en-us/power-platform/blog/power-apps/whats-new-in-power-platform-september-2026-feature-update/)
- **AI駆動のサイト生成**: ポータル作成をAIで簡略化（Wave 1）
- **セキュリティ・ガバナンス強化**: より強力なセキュリティとガバナンスコントロール

---

## Microsoft 365 / Azure 連携

### SharePoint・Teams・Excel との連携に関する変更

- ⭐ **SharePoint/TeamsでのWorkflows体験統合**: SharePointのリスト・ドキュメントライブラリにコマンドバーから「Workflows」ボタンが追加。TeamsのWorkflowsアプリと同じ体験を実現。AutomateとIntegrateメニューを統合
  - [参考: MC1138798](https://mc.merill.net/message/MC1138798/v/2026-01-08T17-39-17-577Z)
- **既存のPower Automateワークフローは影響なし**: 既存のワークフローとポリシーはそのまま維持
- **Power BI Live Visual SharingをOutlook on the webでプレビュー**: Power BIのライブビジュアルをOutlookで共有可能

### Azure との連携に関する変更

- **Azure Native Power Platform Pulumi module v3.28.0リリース（9月13日）**: インフラストラクチャーアズコードでPower Platformリソースを管理するためのPulumiモジュール更新
- **Agentic Center of Enablement（ガバナンス）**: AIエージェントの管理をリアクティブからプロアクティブに転換。リスク検出、課題の優先度付け、修復計画の自動化

---

## AI・Copilot 機能

- ⭐ **Microsoft 365 CopilotがモデルドリブンアプリでGA（4月から）**: アプリ内でデータに関する質問をCopilotに直接聞くことが可能
- ⭐ **Copilotサイドペインの強化**: テーブルデータの要約・ビジュアル化・レコード履歴の要約をサポート。Researcher・Analystなどのファーストパーティエージェントや、Copilot Studioで構築したカスタムエージェントを@メンションで呼び出し可能
  - [参考: Microsoft Power Platform Blog - Model-driven app Copilot](https://www.microsoft.com/en-us/power-platform/blog/2026/04/15/making-business-apps-smarter-with-ai-copilot-and-agents-in-power-apps/)
- **エージェントのモデル駆動型アプリ組み込み（プレビュー）**: エージェントをモデル駆動型アプリに統合可能
- **カスタムツールとリッチビジュアルUIのCopilot会話（5月）**: よりコンテキスト豊かで視覚的かつアクション指向の体験を提供
- **Power Apps MCPサーバー（プレビュー）**: エージェントアクションの人間による監視を可能に
- **行サマリーとCopilot支援フォーム入力（モデル駆動型アプリ、プレビュー）**
- **AI at Workロードマップへの移行**: 2026年9月以降、リリースプランは廃止。新機能情報はAI at Workロードマップで提供

---

## 日本語情報・国内動向

- **リリースプランの廃止と新ロードマップへ移行**: Dynamics 365・Power Platformのリリースプランが2026年9月から公開終了。今後はAI at Workロードマップで案内される形に変更
  - [参考: learn.microsoft.com 日本語リリースプラン](https://learn.microsoft.com/ja-jp/dynamics365/release-plans/)
- **Power Platform Community Conference 2026**: 2026年10月27〜29日にラスベガスのMGM Grandで開催予定。最新発表が期待される
- **2026 Release Wave 2のプレビュー公開**: Wave 2機能が早期アクセス環境で利用可能。2026年10月に一般提供（GA）開始予定
  - [参考: Power Platform 2026 Wave 2 Preview](https://www.aksharatech.com/blog-posts/power-platform-wave-2-2026-preview-what-to-test)
- **モデル駆動型アプリのモダン外観が必須化（4月〜）**: 2026年4月以降、モデル駆動型アプリにモダンルックが必須化。クラシックテーマは新しいモダンルックでは無効となるため、テーマXMLウェブリソースでの新テーマ作成が必要

---

## 参考リンク

- [What's new in Power Platform: September 2026 feature update (Microsoft公式)](https://www.microsoft.com/en-us/power-platform/blog/power-apps/whats-new-in-power-platform-september-2026-feature-update/)
- [Power Platform 2026 release wave 1 plan overview](https://learn.microsoft.com/en-us/power-platform/release-plan/2026wave1/)
- [New and planned features for Power Apps, 2026 release wave 1](https://learn.microsoft.com/en-us/power-platform/release-plan/2026wave1/power-apps/planned-features)
- [Power BI September 2026 Feature Summary](https://community.fabric.microsoft.com/blog/fbc_pbiupdatesblog/power-bi-september-2026-feature-summary/5325831)
- [Microsoft Power Platform September 2026 Update: Enterprise Guide](https://cambaysolutions.com/microsoft-power-platform-september-2026-update)
- [Power Platform 2026 Release Wave 1: Dataverse](https://dynamicscommunities.com/ug/power-platform-ug/power-platform-2026-release-wave-1-dataverse/)
- [Making apps smarter with Copilot and app skills in Power Apps](https://www.microsoft.com/en-us/power-platform/blog/2026/04/15/making-business-apps-smarter-with-ai-copilot-and-agents-in-power-apps/)
- [Power Platform 2026 Wave 2 Preview](https://www.aksharatech.com/blog-posts/power-platform-wave-2-2026-preview-what-to-test)
- [Microsoft 365 September 2026: SharePoint, Teams, Copilot & Power Platform Updates](https://www.aksharatech.com/blog-posts/microsoft-365-september-2026-updates)
