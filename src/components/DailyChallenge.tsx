import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Headphones, Mic, Trophy, Users, MapPin, Loader2 } from "lucide-react";
import { useChallenges } from "@/hooks/useChallenges";

export const DailyChallenge = () => {
  const { dailyChallenge, userProfile, loading, completeChallenge } = useChallenges();
  const [completed, setCompleted] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");

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

  const handleComplete = async (answer: string, isCorrect: boolean) => {
    const success = await completeChallenge(
      dailyChallenge.id, 
      answer, 
      isCorrect, 
      dailyChallenge.points
    );
    
    if (success) {
      setCompleted(true);
      setUserAnswer(answer);
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
              <span className="text-3xl">{dailyChallenge.flag}</span>
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

            {(dailyChallenge.type === "visual" || dailyChallenge.type === "quiz") && dailyChallenge.options?.choices && (
              <div className="grid grid-cols-2 gap-3">
                {dailyChallenge.options.choices.map((option: string, index: number) => (
                  <Button
                    key={index}
                    variant="challenge"
                    onClick={() => handleComplete(option, option === dailyChallenge.correct_answer)}
                    disabled={completed}
                    className={completed && option === dailyChallenge.correct_answer ? "bg-success hover:bg-success" : ""}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}

            {dailyChallenge.type === "cultural" && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Type your answer..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={completed}
                  className="w-full p-4 rounded-lg border-2 border-bridge-start/20 focus:border-bridge-start/60 focus:outline-none disabled:opacity-50"
                />
                <Button 
                  onClick={() => handleComplete(userAnswer, userAnswer.toLowerCase().includes(dailyChallenge.correct_answer?.toLowerCase() || ""))}
                  disabled={completed || !userAnswer.trim()}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bridge Progress */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <MapPin className="h-6 w-6 text-bridge-start" />
          <div>
            <h3 className="font-semibold">Bridge Meter</h3>
            <p className="text-sm text-muted-foreground">Countries you've connected with</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["🇯🇵", "🇮🇹", "🇫🇷", "🇪🇸", "🇰🇷", "🇩🇪"].map((flag, index) => {
            const isUnlocked = userProfile?.countries_bridged.includes(
              flag === "🇯🇵" ? "Japan" : 
              flag === "🇮🇹" ? "Italy" :
              flag === "🇫🇷" ? "France" :
              flag === "🇪🇸" ? "Spain" :
              flag === "🇰🇷" ? "South Korea" :
              "Germany"
            );
            return (
              <div
                key={index}
                className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 ${
                  isUnlocked ? "border-bridge-start bg-bridge-start/10" : "border-muted bg-muted/20"
                }`}
              >
                {flag}
              </div>
            );
          })}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{userProfile?.countries_bridged.length || 0}/12 countries</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-hero h-2 rounded-full transition-all duration-500"
              style={{ width: `${((userProfile?.countries_bridged.length || 0) / 12) * 100}%` }}
            ></div>
          </div>
        </div>
      </Card>
    </div>
  );
};