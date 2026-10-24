import { useCallback, useEffect, useState } from 'react';
import { toAppError } from '@/lib/errors';
import { getProfile } from '@/services/profileService';
import type { Profile } from '@/types/database';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProfile(await getProfile());
    } catch (e) {
      setError(toAppError(e).userMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { profile, setProfile, loading, error, refetch };
}
