-- Performance indexes for dashboard, tasks, schedule, projects, and gantt queries.
-- These are written to match the current query patterns in the app.

create index if not exists idx_tasks_active_end_date_status
  on public.tasks (end_date, status)
  where deleted_at is null;

create index if not exists idx_tasks_active_assignee_end_date_status
  on public.tasks (assignee_id, end_date, status)
  where deleted_at is null
    and assignee_id is not null;

create index if not exists idx_projects_active_status_updated_at
  on public.projects (status, updated_at desc)
  where deleted_at is null;

create index if not exists idx_projects_active_status_name
  on public.projects (status, name)
  where deleted_at is null;

create index if not exists idx_phases_active_project_sort_order
  on public.phases (project_id, sort_order)
  where deleted_at is null;
