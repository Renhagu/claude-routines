# 2026年9月 Power Apps アップデートまとめ

> 調査対象期間: 2026年8月〜9月
> 作成日: 2026年9月10日

---

## Power Platform 関連

### Power Apps の主な変更
- **データグリッドモダンコントロール GA** ⭐: キャンバスアプリ向けに高パフォーマンスで表形式データを表示するデータグリッドモダンコントロールが一般提供開始。組み込みの検索機能も搭載
  - 参照: https://www.microsoft.com/en-us/power-platform/blog/2026/08/06/whats-new-in-power-platform-july-august-2026-feature-update/
- **Power Apps Code Apps** ⭐: 2026年2月にGAとなったCode Appsの開発手法が、GitHub CopilotやClaude Codeとの組み合わせでさらに洗練化。Reactの専門知識がなくてもプロンプトでフル機能のWebアプリを構築可能
  - 参照: https://www.geekfujiwara.com/tech/powerplatform/8554/
- **モダンコントロールへの移行パス**: カスタムページやTeamsアプリでFluent UI コントロールを使用していたメーカー向けに、モダンコントロールへのアップグレードパスが文書化
- **9月以降のリリースプラン廃止**: 2026年9月以降、従来のリリースプランの公開が終了し、新機能は「AI at Work ロードマップ」に移行
  - 参照: https://learn.microsoft.com/en-us/power-platform/release-plan/2026wave1/power-apps/planned-features

#### モデル駆動型アプリ（重点トピック）
- **UIリフレッシュと一貫性強化** ⭐: 標準化されたモダンテーマによる刷新されたUI、ナビゲーションの効率化、使いやすさの向上が実施済み
- **エージェントフィード (Agent Feed)**: エージェントの作業状況管理とクローズドループ学習機能がモデル駆動型アプリに追加（2026年7月）
- **Microsoft 365 Copilot への移行** ⭐: 2026年1月以降、Dynamics 365が有効でない環境ではモデル駆動型アプリのCopilotチャットが非推奨に。Microsoft 365 Copilotが新標準チャット体験として移行中
  - 参照: https://learn.microsoft.com/ja-jp/power-apps/maker/model-driven-apps/add-ai-copilot
- **移行期間中の設定**: メーカーはレガシーCopilotチャットとMicrosoft 365 Copilotのいずれか、または両方を移行期間中に有効化可能
  - 参照: https://learn.microsoft.com/ja-jp/power-apps/maker/model-driven-apps/customize-copilot-chat

### Dataverse の主な変更
- **Dataverse × AIコーディングエージェント連携強化** ⭐: DataverseプラグインがClaude、Cursor、GitHub Copilotなど複数のコーディングエージェントマーケットプレースで利用可能に（2026年7月〜8月）
  - 参照: https://www.geekfujiwara.com/tech/powerplatform/8437/
- **MCPエコシステム拡大**: MCP（Model Context Protocol）サーバー数が60以上に拡大し、認定MCPシステムが作成
- モデル駆動型アプリはDataverseに完全依存しており、テーブル・列・リレーションシップを定義することでアプリUIが自動生成される設計は継続
  - 参照: https://learn.microsoft.com/en-us/power-apps/developer/data-platform/overview

### Power Automate の主な変更
- **フローグループ (Flow Groups) GA** ⭐: 1つのプロセスライセンス（1日25万アクション）を最大25のソリューション対応クラウドフローで共有できる「フローグループ」が利用可能に
  - 参照: https://www.microsoft.com/en-us/power-platform/blog/2026/08/06/whats-new-in-power-platform-july-august-2026-feature-update/
- **Power Automate CLI プラグイン** ⭐: GitHub Copilot CLIおよびClaude Code向けのPower Platformスキルマーケットプレースでプラグインが公開。クラウドフローの作成・編集・実行・デバッグを自然言語で実施可能
  - 参照: https://www.microsoft.com/en-us/power-platform/blog/2026/08/06/whats-new-in-power-platform-july-august-2026-feature-update/
- **SharePoint Thumbnail URL利用フローの更新必須**: 2026年9月1日以降、SharePointサムネイルURLを使用するフローの更新が必要
  - 参照: https://learn.microsoft.com/ja-jp/power-platform/important-changes-coming

### Power BI の主な変更
- **テーマペイン GA**: モダンビジュアルのデフォルト設定とテーマペインが一般提供開始
  - 参照: https://learn.microsoft.com/en-us/power-bi/fundamentals/whats-new
- **セマンティックモデルの細粒度更新コントロール**: スキーマのみ・データのみ・両方を個別に更新できるオプションが追加
- **OneLake画像URLのビジュアル対応**: OneLakeの画像URLをビジュアル内で利用可能に
- **スライサー・マトリックスの書式オプション拡張**: スライサーとマトリックスの書式設定オプションが拡充
- **SharePoint Online組み込み改善**: Power BIレポートのSharePoint Onlineへの埋め込みUIが改善。URLコピー不要でワークスペースを直接選択可能
- **Agent Skills for Power BI** ⭐: AIエージェントがセマンティックモデルとレポートの構築・改善をプロンプトで実施可能に
- **Fabric Apps for Semantic Models**: AIエージェントがFabricネイティブアプリをビルド・デプロイ可能に
  - 参照: https://community.fabric.microsoft.com/blog/fbc_pbiupdatesblog/power-bi-august-2026-feature-summary/5348434

### Power Pages の主な変更
- **セキュリティエージェント (プレビュー)** ⭐: Power Pagesセキュリティワークスペースに組み込まれたAI搭載アシスタント。自然言語でサイトのセキュリティレビュー・設定・強化が可能
  - 参照: https://www.microsoft.com/en-us/power-platform/blog/2026/08/06/whats-new-in-power-platform-july-august-2026-feature-update/

---

## Microsoft 365 / Azure 連携

### SharePoint・Teams・Excel との連携に関する変更
- **SharePoint Framework (SPFx) 1.24 Beta 3**: React 18サポートが1.24で提供予定。Copilot Componentsのパブリックプレビューが開始（2026年10月GAに向けて進行中）
  - 参照: https://devblogs.microsoft.com/microsoft365dev/sharepoint-framework-spfx-roadmap-update-august-2026/
- **Teams内SharePoint体験の強化**: Microsoft Teams内でのSharePointエクスペリエンスが強化され、CopilotによるアクションとナレッジがTeams上で利用しやすく
- **AI会議アーカイブ (.meeting)**: 対象の会議でAI生成サマリーファイルが自動作成され、テナント所有のSharePoint Embeddedに保存
  - 参照: https://empowering.cloud/microsoft-365-ai-workplace-update-august-2026/

### Azure との連携に関する変更
- **Exchange Web Services (EWS) 非推奨** ⭐: Exchange Online の EWSが2026年10月1日から廃止開始。Microsoft Graph・Power Platform・Copilot宣言型エージェントへの移行が必要
  - 参照: https://blog.admindroid.com/microsoft-365-end-of-support-milestones/

---

## AI・Copilot 機能

### Power Apps における Copilot・AI Builder の新機能
- **Copilot × エージェント統合深化** ⭐: CopilotとAIエージェントの深い統合により、従来の自動化を超えたインテリジェントでプロアクティブなシステムの構築が可能に。生産性・意思決定・スケーラビリティを向上
  - 参照: https://www.microsoft.com/en-us/power-platform/blog/2026/04/15/making-business-apps-smarter-with-ai-copilot-and-agents-in-power-apps/
- **モデル駆動型アプリのCopilotチャット移行**: Dynamics 365未導入環境では、レガシーCopilotチャットをMicrosoft 365 Copilotへ移行中
  - 参照: https://learn.microsoft.com/ja-jp/power-apps/maker/model-driven-apps/add-ai-copilot
- **キャンバスアプリCopilotコントロール**: キャンバスアプリにCopilotコントロールを追加できる機能（プレビュー中）
  - 参照: https://learn.microsoft.com/ja-jp/power-apps/maker/canvas-apps/add-ai-copilot
- **AIファースト開発標準 (Code Apps)**: Code Appsの開発をAIエージェントと標準リポジトリで推進するアプローチが確立
  - 参照: https://www.geekfujiwara.com/tech/powerplatform/8554/

---

## 日本語情報・国内動向

- **ギークフジワラ 2026年7月版アップデートまとめ**: Power Apps・Power Automate・Dataverse・Power Pagesの注目トピックを日本語でまとめた記事が公開（8月版は調査時点で未公開）
  - 参照: https://www.geekfujiwara.com/tech/powerplatform/8437/
- **日本語ドキュメント更新**: モデル駆動型アプリのCopilotチャット追加・カスタマイズに関するドキュメントが日本語で更新済み
  - 参照: https://learn.microsoft.com/ja-jp/power-apps/maker/model-driven-apps/add-ai-copilot
- **Power Platform 2026 release wave 1 日本語版**: 2026 リリースウェーブ 1の新機能と計画された機能ページが日本語で更新
  - 参照: https://learn.microsoft.com/ja-jp/power-platform/release-plan/2026wave1/power-apps/planned-features
- **リリースプランの終了**: 2026年9月以降、従来の日本語リリースプランの公開も終了。今後は「AI at Work ロードマップ」に移行することに注意

---

## 重要な注意事項

- 2026年9月以降、Power PlatformのリリースプランはMicrosoftの「AI at Work ロードマップ」に移行します
- SharePoint Thumbnail URLを利用するPower Automateフローは2026年9月1日までに更新が必要です
- Exchange Web Services (EWS)は2026年10月1日から廃止開始のため、早期の移行計画が推奨されます

---

*このまとめはウェブ検索による情報収集に基づいています。最新情報は各公式ドキュメントをご確認ください。*
