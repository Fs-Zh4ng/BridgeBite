import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

// utility: shuffle an array (Fisher-Yates)
function shuffle<T>(array: T[]) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  country: string;
  flag: string;
  points: number;
  difficulty: string;
  options?: Record<string, unknown>;
  correct_answer?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  level: string;
  total_points: number;
  current_streak: number;
  max_streak: number;
  countries_bridged: string[];
  country?: string;
}

export const useChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [dailyChallenge, setDailyChallenge] = useState<Challenge | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentFetchVersion, setRecentFetchVersion] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user profile
  const fetchUserProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setUserProfile(data);
  };

  // Fetch all challenges
  const fetchChallenges = async () => {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching challenges:', error);
      return;
    }

    setChallenges(data || []);
    
    // Choose a daily challenge (only from challenges marked is_daily)
    if (data && data.length > 0) {
      const dailyPool = (data as Challenge[]).filter((c: Challenge & { is_daily?: boolean }) => c.is_daily);
      const pool = dailyPool.length > 0 ? dailyPool : data;
      const randomIndex = Math.floor(Math.random() * pool.length);
      const selected = pool[randomIndex];

      // If there are choices, shuffle them so correct answer isn't predictable
      if (selected?.options?.choices && Array.isArray(selected.options.choices)) {
        const shuffled = shuffle(selected.options.choices);
        setDailyChallenge({
          ...selected,
          options: {
            ...selected.options,
            choices: shuffled
          }
        });
      } else {
        setDailyChallenge(selected);
      }
    }
  };

  // Complete a challenge
  const completeChallenge = async (
    challengeId: string, 
    userAnswer: string, 
    isCorrect: boolean,
    pointsEarned: number
  ) => {
    console.log('[useChallenges] completeChallenge called:', { challengeId, userAnswer, isCorrect, pointsEarned, user: user?.id, userProfile: !!userProfile });
    
    if (!user || !userProfile) {
      console.error('[useChallenges] Missing user or userProfile:', { user: !!user, userProfile: !!userProfile });
      return { recorded: false, awardedFull: false, pointsAwarded: 0 };
    }

    try {
      // Check authentication state
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      console.log('[useChallenges] Auth check:', { 
        authUser: authUser?.id, 
        authError,
        userFromHook: user?.id,
        match: authUser?.id === user?.id
      });
      
      if (authError || !authUser) {
        console.error('[useChallenges] Authentication error:', authError);
        return { recorded: false, awardedFull: false, pointsAwarded: 0 };
      }

      // Ensure the user IDs match
      if (authUser.id !== user.id) {
        console.error('[useChallenges] User ID mismatch:', { authUser: authUser.id, hookUser: user.id });
        return { recorded: false, awardedFull: false, pointsAwarded: 0 };
      }

      // Always create new submissions - no need to check for existing ones
      console.log('[useChallenges] Creating new submission...');

      // Determine points to award: full for correct, half (rounded down) for incorrect
      const pointsAwarded = isCorrect ? pointsEarned : Math.floor(pointsEarned / 2);

      // Record challenge completion - always insert new record
      const payload = {
        user_id: user.id,
        challenge_id: challengeId,
        user_answer: userAnswer,
        is_correct: isCorrect,
        points_earned: pointsAwarded
      };

      console.log('[useChallenges] completeChallenge: inserting new record', { 
        user: user.id, 
        payload
      });

      // Always insert new record
      const { data: insertResult, error: insertErr } = await supabase
        .from('user_challenges')
        .insert(payload)
        .select('*')
        .maybeSingle();

      console.log('[useChallenges] Insert attempt result:', { data: insertResult, error: insertErr });
      
      if (insertErr) {
        console.error('[useChallenges] Insert error details:', {
          code: insertErr.code,
          message: insertErr.message,
          details: insertErr.details,
          hint: insertErr.hint
        });
      }

      const insertData = insertResult;

      if (!insertData) {
        // Surface failure to the user and return
        console.error('[useChallenges] Final insert failed:', insertErr);
        toast({
          title: 'Submission failed',
          description: 'Could not save your attempt. Check your connection or permissions and try again.',
        });
        return { recorded: false, awardedFull: false, pointsAwarded: 0 };
      }

      // Find challenge and new countries list
      const challenge = challenges.find(c => c.id === challengeId);
      const newCountries = challenge && !userProfile.countries_bridged.includes(challenge.country) 
        ? [...userProfile.countries_bridged, challenge.country]
        : userProfile.countries_bridged;

      // If no points awarded (pointsAwarded === 0), bail out after recording
      if (pointsAwarded === 0) {
        toast({
          title: 'No points awarded',
          description: 'This attempt did not earn any points.',
        });

        return { recorded: true, awardedFull: false, pointsAwarded: 0, updatedProfile: userProfile };
      }

      // Always award full points for new submissions
      const pointsDelta = pointsAwarded;
      console.log('[useChallenges] New submission - points awarded:', pointsAwarded);

      // Update user stats: add pointsDelta, but only increment streak for correct answers
      const newPoints = userProfile.total_points + pointsDelta;
      let newStreak = userProfile.current_streak;
      if (isCorrect) {
        // we just upserted a correct completion; compute previous correct before this insertion to decide increment
        const prevCreatedAt = insertData?.completed_at || null;
        let prevCorrectAt: string | null = null;
        try {
          const { data: prevCorrect } = await supabase
            .from('user_challenges')
            .select('completed_at')
            .eq('user_id', user.id)
            .eq('is_correct', true)
            .lt('completed_at', prevCreatedAt)
            .order('completed_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          prevCorrectAt = prevCorrect?.completed_at || null;
        } catch (err) {
          console.error('Error fetching previous correct attempt for streak calculation:', err);
        }

        newStreak = computeNewStreak(prevCorrectAt, userProfile.current_streak);
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          total_points: newPoints,
          current_streak: newStreak,
          max_streak: isCorrect ? Math.max(newStreak, userProfile.max_streak) : userProfile.max_streak,
          countries_bridged: newCountries
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        return { recorded: true, awardedFull: false, pointsAwarded };
      }

      // Create feed post
      if (challenge) {
        const { error: feedError } = await supabase
          .from('feed_posts')
          .insert({
            user_id: user.id,
            challenge_id: challengeId,
            action_type: 'challenge_completed',
            action_description: `${isCorrect ? 'completed' : 'attempted'} the ${challenge.title}`,
            points_earned: pointsAwarded,
            streak_count: newStreak,
            country: challenge.country,
            flag: challenge.flag
          });

        if (feedError) {
          console.error('Error creating feed post:', feedError);
        }
      }

      // Update local state
      const updatedProfile = {
        ...userProfile,
        total_points: newPoints,
        current_streak: newStreak,
        max_streak: isCorrect ? Math.max(newStreak, userProfile.max_streak) : userProfile.max_streak,
        countries_bridged: newCountries
      } as UserProfile;

      setUserProfile(updatedProfile);

      // Toast different messages based on correctness
      if (isCorrect) {
        toast({
          title: "Challenge Complete!",
          description: `+${pointsDelta} points earned. Streak: ${newStreak} days!`,
        });
      } else {
        toast({
          title: "Attempt recorded",
          description: `You earned +${pointsDelta} points for this attempt.`,
        });
      }

      // bump recentFetchVersion so RecentCompletion refreshes
      setRecentFetchVersion(v => v + 1);
      return { recorded: true, awardedFull: isCorrect, pointsAwarded, updatedProfile };
    } catch (error) {
      console.error('Error completing challenge:', error);
      return { recorded: false, awardedFull: false, pointsAwarded: 0 };
    }
  };

  // Pick a new random daily challenge from the already-fetched list
  const pickRandomDaily = useCallback(async () => {
    if (!challenges || challenges.length === 0) return;
    const dailyPool = (challenges as Challenge[]).filter((c: Challenge & { is_daily?: boolean }) => c.is_daily);
    const pool = dailyPool.length > 0 ? dailyPool : challenges;

    // avoid picking the same challenge as currently set
    let selected = null as Challenge | null;
    const maxAttempts = 10;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      const candidate = pool[randomIndex];
      if (!dailyChallenge || candidate.id !== dailyChallenge.id) {
        selected = candidate;
        break;
      }
      // if pool length is 1, break to avoid infinite loop
      if (pool.length === 1) {
        selected = candidate;
        break;
      }
    }

    if (!selected) {
      // fallback: just pick index 0
      selected = pool[0];
    }

    if (selected?.options?.choices && Array.isArray(selected.options.choices)) {
      const shuffled = shuffle(selected.options.choices);
      setDailyChallenge({
        ...selected,
        options: {
          ...selected.options,
          choices: shuffled
        }
      });
    } else {
      setDailyChallenge(selected);
    }
    // notify recent attempt consumers that UI changed (so they can refetch)
    setRecentFetchVersion(v => v + 1);

    // Return a promise that resolves on the next macrotask to allow callers to await React's update propagation
    return new Promise<void>((resolve) => setTimeout(resolve, 0));
  }, [challenges, dailyChallenge]);

  // Get the user's most recent N attempts
  const getRecentCompletions = useCallback(async (limit = 3) => {
    if (!user) return [] as Array<{ id: string; challenge_id: string; is_correct: boolean; points_earned: number; user_answer?: string; created_at: string; challenge?: { id: string; title: string; country: string; flag: string } }>;
    try {
      const { data, error } = await supabase
        .from('user_challenges')
        .select('id, challenge_id, is_correct, points_earned, user_answer, completed_at, challenges(id, title, country, flag)')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent completions:', error);
        return [] as Array<{ id: string; challenge_id: string; is_correct: boolean; points_earned: number; user_answer?: string; created_at: string; challenge?: { id: string; title: string; country: string; flag: string } }>;
      }

      if (!data || (Array.isArray(data) && data.length === 0)) return [] as Array<{ id: string; challenge_id: string; is_correct: boolean; points_earned: number; user_answer?: string; created_at: string; challenge?: { id: string; title: string; country: string; flag: string } }>;

      // Normalize each row to include a `challenge` field and `created_at`
      const normalizedRows = await Promise.all((data as Array<{ id: string; challenge_id: string; is_correct: boolean; points_earned: number; user_answer?: string; completed_at: string; challenges?: { id: string; title: string; country: string; flag: string } }>).map(async (row) => {
        let challenge: { id: string; title: string; country: string; flag: string } | null = null;
        if (row.challenges) {
          const c = row.challenges;
          challenge = Array.isArray(c) ? c[0] : c;
        }

        if (!challenge) {
          challenge = challenges.find(c => c.id === row.challenge_id) || null;
        }

        if (!challenge) {
          try {
            const { data: cdata, error: cerr } = await supabase
              .from('challenges')
              .select('id, title, country, flag')
              .eq('id', row.challenge_id)
              .maybeSingle();
            if (cerr) {
              console.error('Error fetching challenge by id in getRecentCompletions:', cerr);
            } else if (cdata) {
              challenge = cdata as { id: string; title: string; country: string; flag: string };
            }
          } catch (fetchErr) {
            console.error('Unexpected error fetching challenge in getRecentCompletions:', fetchErr);
          }
        }

        return {
          ...row,
          created_at: row.completed_at,
          challenge
        };
      }));

      return normalizedRows;
    } catch (err) {
      console.error('Error in getRecentCompletions:', err);
      return [] as Array<{ id: string; challenge_id: string; is_correct: boolean; points_earned: number; user_answer?: string; created_at: string; challenge?: { id: string; title: string; country: string; flag: string } }>;
    }
  }, [user, challenges]);

  // Get the user's most recent attempt (correct or incorrect)
  const getRecentCompletion = useCallback(async () => {
    const rows = await getRecentCompletions(1);
    return (rows && rows.length > 0) ? rows[0] : null;
  }, [getRecentCompletions]);

  // helper: compute new streak based on previous correct completion date
  const computeNewStreak = (previousCorrectAt: string | null, currentStreak: number) => {
    if (!previousCorrectAt) {
      return 1; // no previous correct completion -> start streak at 1
    }

    const prev = new Date(previousCorrectAt);
    const now = new Date();

    const toYMD = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const daysDiff = Math.floor((toYMD(now) - toYMD(prev)) / 86400000);

    if (daysDiff === 0) {
      // already completed earlier today -> do not increment
      return currentStreak;
    }

    if (daysDiff === 1) {
      // consecutive day -> increment
      return currentStreak + 1;
    }

    // gap > 1 day -> reset streak to 1
    return 1;
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchUserProfile(), fetchChallenges()]).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  return {
    challenges,
    dailyChallenge,
    userProfile,
    loading,
    completeChallenge,
    refetchProfile: fetchUserProfile,
    pickRandomDaily,
    getRecentCompletion,
    getRecentCompletions,
    recentFetchVersion
  };
};