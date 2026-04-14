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
npm run dev
```

## Vercelデプロイ

```bash
npm i -g vercel
vercel
# 環境変数 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を設定
```
