import { useCallback, useEffect, useState } from 'react';
import { useTaskActions } from '@/contexts/TaskActionsContext';
import { toAppError } from '@/lib/errors';
import { getDashboardData } from '@/services/taskService';
import type { DashboardStats, Task } from '@/types/database';

interface DashboardData {
  stats: DashboardStats;
  upcoming: Task[];
  recent: Task[];
}

export function useDashboard() {
  const { version } = useTaskActions();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getDashboardData());
    } catch (e) {
      setError(toAppError(e).userMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, version]);

  return { data, loading, error, refetch: load };
}
