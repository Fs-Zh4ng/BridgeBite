import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { useChallenges } from "@/hooks/useChallenges";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/integrations/supabase/client';

interface RecentCompletionProps {
  fetchRecent?: (limit?: number) => Promise<Array<{ id: string; challenge_id: string; is_correct: boolean; points_earned: number; user_answer?: string; created_at: string; challenge?: { id: string; title: string; country: string; flag: string } }> | null>;
  limit?: number;
  recentFetchVersion?: number;
}

export const RecentCompletion = ({ fetchRecent, limit = 3, recentFetchVersion }: RecentCompletionProps) => {
  const internal = useChallenges();
  // Use a ref to store the fetch function so changes to parent hooks/refs don't retrigger the effect
  const fetchRef = useRef<((limit?: number) => Promise<Array<{ id: string; challenge_id: string; is_correct: boolean; points_earned: number; user_answer?: string; created_at: string; challenge?: { id: string; title: string; country: string; flag: string } }> | null>) | null>(null);
  const { recentFetchVersion: internalVersion } = internal;
  const observedVersion = typeof recentFetchVersion === 'number' ? recentFetchVersion : internalVersion;
  const [recent, setRecent] = useState<Array<{ id: string; challenge_id: string; is_correct: boolean; points_earned: number; user_answer?: string; created_at: string; challenge?: { id: string; title: string; country: string; flag: string } }> | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // update fetchRef when the provided function or internal function changes
  useEffect(() => {
    fetchRef.current = fetchRecent || internal.getRecentCompletions || null;
    console.log('[RecentCompletion] fetchRef updated. using fetchRecent from props?', !!fetchRecent, 'internal available?', !!internal.getRecentCompletions);
  }, [fetchRecent, internal.getRecentCompletions]);

  // Load recent attempts when signaled. Depend only on observedVersion and limit to avoid rerunning
  // because function identities changed; fetchRef.current is used for the actual call.
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const fn = fetchRef.current;
      console.log('[RecentCompletion] load() start. version=', observedVersion, 'limit=', limit, 'hasFetchFn=', typeof fn === 'function');
      const data = fn ? await fn(limit) : null;
      console.log('[RecentCompletion] load() got data length=', Array.isArray(data) ? data.length : (data ? 1 : 0), 'version=', observedVersion);
      if (mounted) setRecent(Array.isArray(data) ? data : (data ? [data] : null));

      // fetch any missing challenge data if needed
      if (Array.isArray(data)) {
        for (const row of data) {
          if (row && !row.challenge && row.challenge_id) {
            try {
              const { data: cdata } = await supabase
                .from('challenges')
                .select('id, title, country, flag')
                .eq('id', row.challenge_id)
                .maybeSingle();
              if (cdata) {
                console.log('[RecentCompletion] fetched missing challenge for', row.challenge_id);
                if (mounted) setRecent(prev => {
                  if (!prev) return prev;
                  return prev.map(r => r.challenge_id === row.challenge_id ? ({ ...r, challenge: cdata }) : r);
                });
              }
            } catch (err) {
              console.error('Error fetching challenge in RecentCompletion:', err);
            }
          }
        }
      }

      setLoading(false);
      console.log('[RecentCompletion] load() finished.');
    };
    load();
    return () => { mounted = false; };
    // re-run only when the observed version changes or when the limit changes
  }, [observedVersion, limit]);

  // If auth is still initializing, avoid showing the recent attempt area so the page doesn't look stuck.
  if (authLoading) return <div className="text-sm text-muted-foreground">Loading recent attempt…</div>;
  if (!user) return <div className="text-sm text-muted-foreground">Sign in to see recent attempts</div>;

  if (loading) return <div className="text-sm text-muted-foreground">Loading recent attempts…</div>;
  if (!recent || recent.length === 0) return <div className="text-sm text-muted-foreground">No recent attempts</div>;

  const renderFlag = (r: { challenge?: { country: string; flag: string } }) => {
    const flag = r.challenge?.flag || (r.challenge?.country ? r.challenge.country.split(" ").map((p:string)=>p[0]).slice(0,3).join("") : '');
    return (<div className="w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 border-bridge-start bg-bridge-start/10">{flag}</div>);
  };

  return (
    <div className="space-y-3">
      {recent.map((r, idx) => (
        <div key={r.id || idx} className="flex items-start gap-4">
          {renderFlag(r)}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{r.challenge?.title || r.challenge?.id || 'Unknown challenge'}</div>
                <div className="text-sm text-muted-foreground">{r.challenge?.country}</div>
              </div>
              <div className="text-right">
                <Badge variant={r.is_correct ? "secondary" : "destructive"} className="text-sm">
                  {r.is_correct ? "Correct" : "Attempted"}
                </Badge>
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">Answer: <span className="font-medium text-foreground">{r.user_answer || "—"}</span></div>
            <div className="mt-1 text-xs text-muted-foreground">Points: {r.points_earned} • {r.created_at ? new Date(r.created_at).toLocaleString() : ''}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentCompletion;
