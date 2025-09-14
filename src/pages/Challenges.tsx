import { Navigation } from "@/components/Navigation";
import { DailyChallenge } from "@/components/DailyChallenge";
import { Auth } from "@/components/Auth";
import { useAuth } from "@/hooks/useAuth";
import { RecentCompletion } from "@/components/RecentCompletion";
import { useChallenges } from "@/hooks/useChallenges";
import { Card } from "@/components/ui/card";
import challenges from '@/data/challenges.json';
import { countryFlagMap } from '@/data/flags';

const ChallengesPage = () => {
  const { user, loading } = useAuth();
  // Use a single hook instance at the page level and pass its state & functions down
  const { userProfile, dailyChallenge, loading: challengesLoading, completeChallenge, pickRandomDaily, getRecentCompletions, recentFetchVersion } = useChallenges();

  const resolveFlag = (countryRaw: string) => {
    if (!countryRaw) return null;
    const key = countryRaw.trim().toLowerCase();
    if (countryFlagMap[key]) return countryFlagMap[key];
    // try partial match from challenges.json as fallback
    const challengeFlagMap: Record<string, string> = {};
    (challenges as Array<{ country?: string; flag?: string }>).forEach((c) => {
      if (c && c.country && c.flag) {
        challengeFlagMap[c.country.trim().toLowerCase()] = c.flag;
      }
    });
    if (challengeFlagMap[key]) return challengeFlagMap[key];
    const match = Object.keys(challengeFlagMap).find(k => k.includes(key) || key.includes(k));
    if (match) return challengeFlagMap[match];
    return null;
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>
  );

  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Challenges</h1>
          {/* pass the page-level hook state & handlers so child components share the same instance */}
          <DailyChallenge
            dailyChallenge={dailyChallenge}
            userProfile={userProfile}
            loading={challengesLoading}
            completeChallenge={completeChallenge}
            pickRandomDaily={pickRandomDaily}
            getRecentCompletion={getRecentCompletions}
          />

          <div className="mt-6">
            <Card className="p-4 bg-card rounded-lg border">
              <h4 className="font-semibold mb-2">Most recent attempt</h4>
              <RecentCompletion fetchRecent={getRecentCompletions} limit={3} recentFetchVersion={recentFetchVersion} />
            </Card>
          </div>

          <div className="mt-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Bridge Meter</h3>
              <p className="text-sm text-muted-foreground">Countries you've connected with</p>
              <div className="mt-4">
                {userProfile?.countries_bridged && userProfile.countries_bridged.length > 0 ? (
                  <div className="flex gap-2 flex-wrap">
                    {userProfile.countries_bridged.map((c: string, i: number) => (
                      <div key={i} className="w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 border-bridge-start bg-bridge-start/10" title={c}>
                        <span>{resolveFlag(c) || c.split(/\s+/).map((w:string)=>w[0]).slice(0,3).join("")}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No countries connected yet</div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChallengesPage;
