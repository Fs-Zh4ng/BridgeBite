import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Headphones, Mic, Trophy, Users, MapPin, Loader2 } from "lucide-react";
import { useChallenges } from "@/hooks/useChallenges";
import { useToast } from "@/hooks/use-toast";
import challenges from '@/data/challenges.json';

export const DailyChallenge = ({
  dailyChallenge: dailyProp,
  userProfile: userProfileProp,
  loading: loadingProp,
  completeChallenge: completeChallengeProp,
  pickRandomDaily: pickRandomProp,
  getRecentCompletion: getRecentProp
}: {
  dailyChallenge?: { id: string; title: string; country: string; flag: string; points: number; difficulty: string; options?: Record<string, unknown>; correct_answer?: string; type: string; created_at: string } | null,
  userProfile?: { user_id: string; username: string; display_name: string; points: number; level: string; country?: string } | null,
  loading?: boolean,
  completeChallenge?: (id: string, answer: string, isCorrect: boolean, points: number) => Promise<{ success: boolean; error?: string }>,
  pickRandomDaily?: () => void,
  getRecentCompletion?: (limit?: number) => Promise<Array<{ id: string; challenge_id: string; is_correct: boolean; points_earned: number; user_answer?: string; created_at: string; challenge?: { id: string; title: string; country: string; flag: string } }> | null>
} = {}) => {
  const internal = useChallenges();
  const dailyChallenge = dailyProp || internal.dailyChallenge;
  const userProfile = userProfileProp || internal.userProfile;
  const loading = typeof loadingProp === 'boolean' ? loadingProp : internal.loading;
  const completeChallenge = completeChallengeProp || internal.completeChallenge;
  const pickRandomDaily = pickRandomProp || internal.pickRandomDaily;
  const getRecentCompletion = getRecentProp || internal.getRecentCompletion;
  const { toast } = useToast();
  const [completed, setCompleted] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [disabledAfterAttempt, setDisabledAfterAttempt] = useState(false);

  // Reset UI state when a new daily challenge is loaded
  useEffect(() => {
    setCompleted(false);
    setUserAnswer("");
    setDisabledAfterAttempt(false);
  }, [dailyChallenge?.id]);

  if (loading || !dailyChallenge) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </Card>
      </div>
    );
  }

  // build lookups once to avoid recomputing inside render loop
  const countryToFlagManual: Record<string, string> = {
    Japan: "🇯🇵",
    Italy: "🇮🇹",
    France: "🇫🇷",
    Spain: "🇪🇸",
    "South Korea": "🇰🇷",
    Germany: "🇩🇪",
    Canada: "🇨🇦",
    Brazil: "🇧🇷",
    India: "🇮🇳",
    Australia: "🇦🇺",
    Mexico: "🇲🇽",
    China: "🇨🇳",
    "United Kingdom": "🇬🇧",
    UK: "🇬🇧",
    "United States": "🇺🇸",
    USA: "🇺🇸"
  };

  // From challenges JSON (seed data) -> normalize keys
  const challengeFlagMap: Record<string, string> = {};
  (challenges as Array<{ country?: string; flag?: string }>).forEach((c) => {
    if (c && c.country && c.flag) {
      challengeFlagMap[c.country.trim().toLowerCase()] = c.flag;
    }
  });

  // common aliases
  const aliasMap: Record<string, string> = {
    us: 'united states',
    usa: 'united states',
    uk: 'united kingdom',
    'u.k.': 'united kingdom',
    'united states of america': 'united states'
  };

  const resolveFlag = (countryRaw: string) => {
    if (!countryRaw) return null;
    const raw = countryRaw.trim();
    const key = raw.toLowerCase();

    // manual map exact
    if (countryToFlagManual[raw]) return countryToFlagManual[raw];
    if (countryToFlagManual[raw.trim()]) return countryToFlagManual[raw.trim()];

    // challenge seed map
    if (challengeFlagMap[key]) return challengeFlagMap[key];

    // alias map
    if (aliasMap[key] && challengeFlagMap[aliasMap[key]]) return challengeFlagMap[aliasMap[key]];

    // try matching by contains (e.g., 'United States' vs 'United States of America')
    const match = Object.keys(challengeFlagMap).find(k => k.includes(key) || key.includes(k));
    if (match) return challengeFlagMap[match];

    return null;
  };

  const handleComplete = async (answer: string, isCorrect: boolean) => {
    // call completeChallenge which now returns { recorded, awardedFull, pointsAwarded }
    const result = await completeChallenge(
      dailyChallenge.id,
      answer,
      isCorrect,
      dailyChallenge.points
    );

    // If call failed or nothing recorded
    if (!result || !result.recorded) {
      toast({
        title: 'Error',
        description: 'Could not record your attempt. Try again.',
      });
      return;
    }

    // Use the local correctness determination to drive immediate UI state.
    // Server-side awardedFull may be noisy (fuzzy scoring), so prefer the explicit user action correctness for UI
    if (isCorrect) {
      setCompleted(true);
      setUserAnswer(answer);
    } else if (result.pointsAwarded > 0) {
      // partial credit: show partial UI but do not mark as fully completed
      setUserAnswer(answer);
      setDisabledAfterAttempt(true);
      toast({
        title: 'Partial credit',
        description: `You earned +${result.pointsAwarded} points for this attempt.`,
      });
    } else {
      // zero points
      setDisabledAfterAttempt(true);
      toast({
        title: 'Incorrect',
        description: 'That answer was not correct. No points awarded.',
      });
    }

    // Ensure the profile data (total points / streak) is refreshed in the UI immediately.
    // The hook updates profile server-side, but the page may be using a different hook instance; refetch to be safe.
    try {
      if (internal && typeof (internal as { refetchProfile?: () => Promise<void> }).refetchProfile === 'function') {
        await (internal as { refetchProfile: () => Promise<void> }).refetchProfile();
        console.log('[DailyChallenge] refetched profile after completion');
      }
    } catch (err) {
      console.error('[DailyChallenge] error refetching profile:', err);
    }
  };

  // Ensure Next Challenge reliably calls the page-level or internal pickRandomDaily and triggers recent refresh.
  const handleNext = async () => {
    try {
      console.log('[DailyChallenge] handleNext called.');
      const fn = pickRandomDaily || internal.pickRandomDaily;
      if (typeof fn === 'function') {
        try {
          const res = fn();
          await Promise.resolve(res);
          console.log('[DailyChallenge] pickRandomDaily called successfully. Relying on recentFetchVersion to refresh RecentCompletion.');
        } catch (err) {
          console.error('[DailyChallenge] error awaiting pickRandomDaily:', err);
        }
      } else {
        console.warn('[DailyChallenge] pickRandomDaily is not a function', pickRandomDaily, internal.pickRandomDaily);
      }

      // Do NOT call the recent fetch directly here; rely on the hook's recentFetchVersion signal
      // to cause RecentCompletion to reload. Manual fetches here created races/inconsistency.
    } catch (err) {
      console.error('[DailyChallenge] handleNext error:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with streak */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-accent p-3 rounded-full">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Daily Challenge</h2>
            <p className="text-muted-foreground">Keep your streak alive!</p>
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-bridge-start">
            {userProfile?.current_streak || 0}
          </div>
          <div className="text-sm text-muted-foreground">day streak</div>
        </div>
      </div>

      {/* Challenge Card */}
      <Card className="bg-gradient-card shadow-card border-0 overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{resolveFlag(dailyChallenge.country) || dailyChallenge.flag}</span>
              <div>
                <Badge variant="secondary" className="mb-2">
                  {dailyChallenge.difficulty}
                </Badge>
                <h3 className="text-xl font-semibold">{dailyChallenge.title}</h3>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-bridge-start">{dailyChallenge.points}</div>
              <div className="text-sm text-muted-foreground">points</div>
            </div>
          </div>

          <p className="text-lg mb-6">{dailyChallenge.description}</p>

          {/* Challenge Interface */}
          <div className="space-y-4">
            {dailyChallenge.type === "audio" && (
              <div className="flex gap-4">
                <Button variant="challenge" className="flex-1">
                  <Headphones className="mr-2 h-4 w-4" />
                  Listen
                </Button>
                <Button 
                  variant="challenge" 
                  className="flex-1" 
                  onClick={() => handleComplete("audio_recorded", true)}
                  disabled={completed}
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Record
                </Button>
              </div>
            )}

            {(dailyChallenge.type === "visual" || dailyChallenge.type === "quiz") && (
              dailyChallenge.options?.choices && Array.isArray(dailyChallenge.options.choices) ? (
                <div className="grid grid-cols-2 gap-3">
                  {dailyChallenge.options.choices.map((option: string, index: number) => {
                    const normalizedCorrect = (dailyChallenge.correct_answer || '').toLowerCase().trim();
                    const normalizedOption = (option || '').toLowerCase().trim();
                    return (
                      <Button
                        key={index}
                        variant="challenge"
                        onClick={() => handleComplete(option, normalizedOption === normalizedCorrect)}
                        disabled={completed || disabledAfterAttempt}
                        className={completed && normalizedOption === normalizedCorrect ? "bg-success hover:bg-success" : ""}
                      >
                        {option}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                // Fallback: show a text input for non-MCQ challenges (or when choices are missing)
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Type your answer..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    disabled={completed || disabledAfterAttempt}
                    className="w-full p-4 rounded-lg border-2 border-bridge-start/20 focus:border-bridge-start/60 focus:outline-none disabled:opacity-50"
                  />
                  {dailyChallenge.correct_answer ? (
                    <Button
                      onClick={() => handleComplete(userAnswer, userAnswer.trim().toLowerCase() === (dailyChallenge.correct_answer || '').toLowerCase())}
                      disabled={completed || !userAnswer.trim() || disabledAfterAttempt}
                      className="w-full"
                    >
                      Submit Answer
                    </Button>
                  ) : (
                    <div className="text-sm text-muted-foreground">No correct answer available for this challenge.</div>
                  )}
                </div>
              )
            )}

            {dailyChallenge.type === "cultural" && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Type your answer..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={completed || disabledAfterAttempt}
                  className="w-full p-4 rounded-lg border-2 border-bridge-start/20 focus:border-bridge-start/60 focus:outline-none disabled:opacity-50"
                />
                <Button 
                  onClick={() => handleComplete(userAnswer, userAnswer.toLowerCase().includes(dailyChallenge.correct_answer?.toLowerCase() || ""))}
                  disabled={completed || !userAnswer.trim() || disabledAfterAttempt}
                  className="w-full"
                >
                  Submit Answer
                </Button>
              </div>
            )}
          </div>

          {/* Success State */}
          {completed && (
            <div className="mt-6 p-4 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="h-5 w-5 text-success" />
                <span className="font-semibold text-success">Challenge Complete!</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Great job! You earned {dailyChallenge.points} points and learned something new about {dailyChallenge.country}.
              </p>
              <div className="text-sm text-muted-foreground">
                Come back tomorrow for a new challenge!
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={() => { console.log('[DailyChallenge] Next clicked (success state)'); handleNext(); }}>Next Challenge</Button>
              </div>
            </div>
          )}

          {/* Partial credit UI */}
          {!completed && disabledAfterAttempt && (
            <div className="mt-6 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <div className="flex items-center gap-3 mb-3">
                <Trophy className="h-5 w-5 text-destructive" />
                <span className="font-semibold text-destructive">Partial Credit</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                You received partial credit for this attempt. Keep practicing!
              </p>
              <div className="text-sm mb-4">Correct answer: <strong className="text-destructive">{dailyChallenge.correct_answer}</strong></div>
              <div className="flex gap-2">
                <Button onClick={() => { console.log('[DailyChallenge] Next clicked (partial state)'); handleNext(); }} className="ml-auto">Next Challenge</Button>
              </div>
            </div>
          )}
          {!completed && !userAnswer && disabledAfterAttempt && (
            <div className="mt-6 flex justify-end">
              <Button onClick={() => { console.log('[DailyChallenge] Next clicked (fallback state)'); handleNext(); }}>Next Challenge</Button>
            </div>
          )}
          {/* Cultural input: disable after attempt to avoid accidental submits */}
          {dailyChallenge.type === "cultural" && (
            <style>{`/* noop to keep patch region */`}</style>
          )}
        </CardContent>
      </Card>
    </div>
  );
};