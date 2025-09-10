import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Headphones, Mic, Trophy, Users, MapPin } from "lucide-react";

const challenges = [
  {
    id: 1,
    type: "audio",
    title: "Learn Japanese Greeting",
    description: "Listen and repeat: 'Ohayo gozaimasu' (Good morning)",
    country: "Japan",
    flag: "🇯🇵",
    points: 10,
    difficulty: "Easy"
  },
  {
    id: 2,
    type: "visual",
    title: "Guess the Dish",
    description: "Which country is famous for this delicious dish?",
    country: "Italy",
    flag: "🇮🇹",
    points: 15,
    difficulty: "Medium"
  },
  {
    id: 3,
    type: "cultural",
    title: "Proverb Wisdom",
    description: "Complete this saying: 'When in Rome...'",
    country: "Italy",
    flag: "🇮🇹",
    points: 20,
    difficulty: "Hard"
  }
];

export const DailyChallenge = () => {
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [streak, setStreak] = useState(7);

  const challenge = challenges[currentChallenge];

  const handleComplete = () => {
    setCompleted(true);
    // Could trigger confetti or celebration animation here
  };

  const nextChallenge = () => {
    if (currentChallenge < challenges.length - 1) {
      setCurrentChallenge(currentChallenge + 1);
      setCompleted(false);
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
          <div className="text-3xl font-bold text-bridge-start">{streak}</div>
          <div className="text-sm text-muted-foreground">day streak</div>
        </div>
      </div>

      {/* Challenge Card */}
      <Card className="bg-gradient-card shadow-card border-0 overflow-hidden">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{challenge.flag}</span>
              <div>
                <Badge variant="secondary" className="mb-2">
                  {challenge.difficulty}
                </Badge>
                <h3 className="text-xl font-semibold">{challenge.title}</h3>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-bridge-start">{challenge.points}</div>
              <div className="text-sm text-muted-foreground">points</div>
            </div>
          </div>

          <p className="text-lg mb-6">{challenge.description}</p>

          {/* Challenge Interface */}
          <div className="space-y-4">
            {challenge.type === "audio" && (
              <div className="flex gap-4">
                <Button variant="challenge" className="flex-1">
                  <Headphones className="mr-2 h-4 w-4" />
                  Listen
                </Button>
                <Button variant="challenge" className="flex-1" disabled={!completed}>
                  <Mic className="mr-2 h-4 w-4" />
                  Record
                </Button>
              </div>
            )}

            {challenge.type === "visual" && (
              <div className="grid grid-cols-2 gap-3">
                {["🇮🇹 Italy", "🇫🇷 France", "🇪🇸 Spain", "🇬🇷 Greece"].map((option, index) => (
                  <Button
                    key={index}
                    variant="challenge"
                    onClick={() => index === 0 && handleComplete()}
                    className={completed && index === 0 ? "bg-success hover:bg-success" : ""}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            )}

            {challenge.type === "cultural" && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Type your answer..."
                  className="w-full p-4 rounded-lg border-2 border-bridge-start/20 focus:border-bridge-start/60 focus:outline-none"
                />
                <Button onClick={handleComplete} className="w-full">
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
                Great job! You earned {challenge.points} points and learned something new about {challenge.country}.
              </p>
              <Button onClick={nextChallenge} variant="success" className="w-full">
                Next Challenge
              </Button>
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
          {["🇯🇵", "🇮🇹", "🇫🇷", "🇪🇸", "🇰🇷", "🇩🇪"].map((flag, index) => (
            <div
              key={index}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 ${
                index < 4 ? "border-bridge-start bg-bridge-start/10" : "border-muted bg-muted/20"
              }`}
            >
              {flag}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>4/12 countries</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-gradient-hero h-2 rounded-full w-1/3"></div>
          </div>
        </div>
      </Card>
    </div>
  );
};