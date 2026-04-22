# project-task-tracker-fir
社内向けの工程表・スケジュール・タスク・進捗を一元管理するWebツール

## 技術スタック
| 役割 | 技術 |
|---|---|
| フロントエンド / BFF | Next.js 14（App Router） |
| スタイル | Tailwind CSS |
| DB / 認証 | Supabase（PostgreSQL） |
| ガントチャート | Frappe Gantt |
| ホスティング | Vercel（無料） |

## ローカル起動手順

```bash
npm install
cp .env.local.example .env.local
# .env.local にSupabaseの接続情報を記入
# 管理画面からユーザー追加も使う場合は SUPABASE_SERVICE_ROLE_KEY も設定
npm run dev
```

## Supabaseメンテナンス

重くなりやすい一覧・ダッシュボード系のクエリ向けに、以下のindex追加SQLを用意しています。

- `supabase/migrations/20260421_add_performance_indexes.sql`
- `supabase/migrations/20260422_harden_users_rls.sql`

Supabase SQL Editorで実行するか、運用中のmigrationフローに組み込んで適用してください。

## Vercelデプロイ

```bash
npm i -g vercel
vercel
# 環境変数 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を設定
# 管理画面からユーザー追加を使う場合は SUPABASE_SERVICE_ROLE_KEY も設定
```
