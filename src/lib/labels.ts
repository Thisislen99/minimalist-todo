import type { TaskPriority, TaskSortKey, TaskStatus, TaskView } from '@/types/database';

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'ยังไม่เริ่ม',
  in_progress: 'กำลังทำ',
  completed: 'เสร็จแล้ว',
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'ต่ำ',
  medium: 'ปานกลาง',
  high: 'สูง',
};

export const SORT_LABEL: Record<TaskSortKey, string> = {
  due_date: 'วันครบกำหนด',
  created_at: 'วันที่สร้าง',
  priority: 'ความสำคัญ',
};

export const VIEW_TITLE: Record<TaskView, string> = {
  all: 'งานทั้งหมด',
  today: 'วันนี้',
  upcoming: 'กำลังจะมาถึง',
  completed: 'เสร็จแล้ว',
};

export const VIEW_DESCRIPTION: Record<TaskView, string> = {
  all: 'งานทุกรายการของคุณ',
  today: 'งานที่ครบกำหนดวันนี้และงานที่เลยกำหนด',
  upcoming: 'งานที่ครบกำหนดหลังจากวันนี้',
  completed: 'งานที่ทำเสร็จแล้ว',
};
