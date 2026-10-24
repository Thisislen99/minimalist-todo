export const TASK_STATUSES = ['todo', 'in_progress', 'completed'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskInput {
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  category_id: string | null;
}

export interface CategoryInput {
  name: string;
  color: string;
}

export type TaskView = 'all' | 'today' | 'upcoming' | 'completed';
export type TaskSortKey = 'due_date' | 'created_at' | 'priority';
export type SortDirection = 'asc' | 'desc';

export interface TaskFilters {
  view: TaskView;
  search: string;
  status: TaskStatus | '';
  priority: TaskPriority | '';
  categoryId: string;
  overdueOnly: boolean;
}

export interface TaskQuery extends TaskFilters {
  sortKey: TaskSortKey;
  sortDir: SortDirection;
  page: number;
  pageSize: number;
}

export interface DashboardStats {
  total: number;
  todo: number;
  in_progress: number;
  completed: number;
  overdue: number;
}
