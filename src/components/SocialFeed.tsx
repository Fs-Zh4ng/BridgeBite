import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Trophy, Zap, Users } from "lucide-react";

const feedItems = [
  {
    id: 1,
    user: {
      name: "Sarah Chen",
      avatar: "SC",
      level: "Culture Explorer"
    },
    action: "completed the Japanese greeting challenge",
    points: 10,
    streak: 12,
    timeAgo: "2 hours ago",
    flag: "🇯🇵",
    likes: 24,
    comments: 8
  },
  {
    id: 2,
    user: {
      name: "Miguel Santos",
      avatar: "MS",
      level: "Bridge Builder"
    },
    action: "achieved a 30-day streak",
    points: 100,
    streak: 30,
    timeAgo: "4 hours ago",
    flag: "🏆",
    likes: 89,
    comments: 23
  },
  {
    id: 3,
    user: {
      name: "Aisha Patel",
      avatar: "AP",
      level: "World Connector"
    },
    action: "mastered French cuisine challenge",
    points: 25,
    streak: 8,
    timeAgo: "1 day ago",
    flag: "🇫🇷",
    likes: 42,
    comments: 15
  }
];

export const SocialFeed = () => {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Community Feed</h2>
        <Button variant="outline" size="sm">
          <Users className="h-4 w-4 mr-2" />
          Find Friends
        </Button>
      </div>

      {feedItems.map((item) => (
        <Card key={item.id} className="bg-gradient-card border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" />
                <AvatarFallback className="bg-bridge-start text-white font-semibold">
                  {item.user.avatar}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{item.user.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {item.user.level}
                  </Badge>
                  <span className="text-2xl ml-auto">{item.flag}</span>
                </div>
                
                <p className="text-muted-foreground mb-3">
                  {item.action}
                </p>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-bridge-start" />
                    <span className="text-sm font-medium">+{item.points} points</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-bridge-accent" />
                    <span className="text-sm font-medium">{item.streak} day streak</span>
                  </div>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {item.timeAgo}
                  </span>
                </div>
                
                <div className="flex items-center gap-6 pt-3 border-t border-border">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Heart className="h-4 w-4 mr-1" />
                    {item.likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {item.comments}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Card className="bg-gradient-accent p-6 text-center text-white">
        <Trophy className="h-12 w-12 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Weekly Challenge</h3>
        <p className="mb-4 opacity-90">
          Complete 5 challenges this week to unlock the "Cultural Ambassador" badge!
        </p>
        <Button variant="secondary" size="lg">
          Join Challenge
        </Button>
      </Card>
    </div>
  );
};