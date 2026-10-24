import { useCallback, useEffect, useMemo, useState } from 'react';
import { toAppError } from '@/lib/errors';
import { listCategories } from '@/services/categoryService';
import type { Category } from '@/types/database';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await listCategories());
    } catch (e) {
      setError(toAppError(e).userMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  return { categories, byId, loading, error, refetch };
}
