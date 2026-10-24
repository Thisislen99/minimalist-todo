import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PRIORITY_LABEL, SORT_LABEL, STATUS_LABEL } from '@/lib/labels';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Category,
  type TaskPriority,
  type TaskQuery,
  type TaskSortKey,
  type TaskStatus,
} from '@/types/database';

interface Props {
  query: TaskQuery;
  categories: Category[];
  onChange: (patch: Partial<TaskQuery>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function TaskFilters({ query, categories, onChange, onClear, hasActiveFilters }: Props) {
  const [search, setSearch] = useState(query.search);

  // debounce การพิมพ์ค้นหา
  useEffect(() => {
    if (search === query.search) return;
    const t = setTimeout(() => onChange({ search }), 300);
    return () => clearTimeout(t);
  }, [search, query.search, onChange]);

  // ล้างตัวกรองจากภายนอก -> sync ช่องค้นหา
  useEffect(() => setSearch(query.search), [query.search]);

  const showStatus = query.view === 'all';

  return (
    <div className="mb-4 space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
        <input
          type="search"
          aria-label="ค้นหางาน"
          placeholder="ค้นหาจากชื่อหรือรายละเอียด"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field pl-9"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {showStatus && (
          <select
            aria-label="กรองตามสถานะ"
            className="field w-auto"
            value={query.status}
            onChange={(e) => onChange({ status: e.target.value as TaskStatus | '' })}
          >
            <option value="">ทุกสถานะ</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="กรองตามความสำคัญ"
          className="field w-auto"
          value={query.priority}
          onChange={(e) => onChange({ priority: e.target.value as TaskPriority | '' })}
        >
          <option value="">ทุกระดับความสำคัญ</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </select>
        <select
          aria-label="กรองตามหมวดหมู่"
          className="field w-auto"
          value={query.categoryId}
          onChange={(e) => onChange({ categoryId: e.target.value })}
        >
          <option value="">ทุกหมวดหมู่</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {showStatus && (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900">
            <input
              type="checkbox"
              checked={query.overdueOnly}
              onChange={(e) => onChange({ overdueOnly: e.target.checked })}
              className="h-4 w-4 accent-blue-600"
            />
            เลยกำหนด
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          เรียงตาม
          <select
            className="field w-auto"
            value={query.sortKey}
            onChange={(e) => onChange({ sortKey: e.target.value as TaskSortKey })}
          >
            {(Object.keys(SORT_LABEL) as TaskSortKey[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="secondary"
          aria-label={query.sortDir === 'asc' ? 'เรียงจากน้อยไปมาก (กดเพื่อสลับ)' : 'เรียงจากมากไปน้อย (กดเพื่อสลับ)'}
          onClick={() => onChange({ sortDir: query.sortDir === 'asc' ? 'desc' : 'asc' })}
        >
          {query.sortDir === 'asc' ? (
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
          )}
          {query.sortDir === 'asc' ? 'น้อยไปมาก' : 'มากไปน้อย'}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClear}>
            <X className="h-4 w-4" aria-hidden="true" />
            ล้างตัวกรอง
          </Button>
        )}
      </div>
    </div>
  );
}
