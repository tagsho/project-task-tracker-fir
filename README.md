# 工程表・スケジュール管理ツール

Next.js 14 + Supabase（PostgreSQL）で構築した社内向けスケジュール管理ツール。

## 技術スタック

| 役割 | 技術 |
|---|---|
| フロントエンド / BFF | Next.js 14（App Router） |
| スタイル | Tailwind CSS |
| DB / 認証 | Supabase（PostgreSQL） |
| ガントチャート | Frappe Gantt |
| ホスティング | Vercel（無料） |

---

## ローカル起動手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/yourname/schedule-tool.git
cd schedule-tool
```

### 2. 依存パッケージをインストール

```bash
npm install
```

### 3. Supabaseプロジェクトを作成

1. https://supabase.com でアカウント作成
2. 「New project」でプロジェクト作成
3. ダッシュボード → Settings → API から以下を取得
   - `Project URL`
   - `anon public` キー

### 4. 環境変数を設定

```bash
cp .env.local.example .env.local
# .env.local を開いて上記の値を記入
```

### 5. DBのテーブルを作成

Supabase ダッシュボード → SQL Editor で以下を実行：

```sql
-- 別途配布のマイグレーションファイルを貼り付けて実行
```

または Supabase CLI を使う場合：

```bash
npx supabase db push
```

### 6. Supabase Authでユーザー作成

Supabase ダッシュボード → Authentication → Users → 「Add user」から招待メールを送る。
その後 `users` テーブルに同じ `id` でプロフィールを INSERT する。

```sql
INSERT INTO users (id, name, login_id, role, is_active)
VALUES ('（Auth で発行されたUUID）', '山田 太郎', 'yamada@example.com', 'admin', true);
```

### 7. 起動

```bash
npm run dev
# http://localhost:3000 でアクセス
```

---

## Vercelへのデプロイ

```bash
# Vercel CLIをインストール
npm i -g vercel

# デプロイ
vercel

# 環境変数を設定（初回のみ）
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

または GitHub と連携して自動デプロイ：
1. GitHubにpush
2. https://vercel.com でリポジトリを連携
3. 環境変数を Vercel ダッシュボードで設定
4. 以降は `git push` のたびに自動デプロイ

---

## ファイル構成

```
schedule-tool/
├── app/
│   ├── (auth)/              # ログイン必須ページ群
│   │   ├── layout.tsx       # サイドバー付きレイアウト
│   │   ├── dashboard/       # ダッシュボード
│   │   ├── projects/        # 案件一覧・詳細・作成・編集
│   │   ├── gantt/           # ガントチャート
│   │   └── users/           # ユーザー管理（管理者のみ）
│   ├── login/               # ログインページ
│   ├── layout.tsx           # ルートレイアウト
│   └── page.tsx             # / → /dashboard にリダイレクト
├── components/
│   ├── Sidebar.tsx          # サイドバーナビ
│   ├── ProjectForm.tsx      # 案件作成・編集フォーム
│   ├── TaskProgressForm.tsx # タスク進捗更新
│   ├── CommentSection.tsx   # コメントスレッド
│   ├── GanttChart.tsx       # Frappe Ganttラッパー
│   └── UserTable.tsx        # ユーザー管理テーブル
├── lib/
│   ├── supabase.ts          # ブラウザ用Supabaseクライアント
│   └── supabase-server.ts   # サーバー用Supabaseクライアント
├── types/
│   └── index.ts             # 型定義・定数
├── middleware.ts             # 未認証リダイレクト
├── .env.local.example       # 環境変数テンプレート
└── README.md
```

---

## 権限

| 操作 | 管理者 | 一般ユーザー |
|---|:---:|:---:|
| 案件の作成・編集 | ✅ | ❌ |
| 自担当タスクの進捗更新 | ✅ | ✅ |
| ガントチャートの日程変更 | ✅ | ❌ |
| コメント投稿 | ✅ | ✅ |
| ユーザー管理 | ✅ | ❌ |
