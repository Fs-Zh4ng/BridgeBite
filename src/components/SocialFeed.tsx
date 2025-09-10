import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2, Trophy, Zap, Users, Loader2 } from "lucide-react";
import { useSocialFeed } from "@/hooks/useSocialFeed";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import FriendSuggestions from "@/components/FriendSuggestions";
import { Link } from "react-router-dom";

export const SocialFeed = () => {
  const { feedPosts, loading, toggleLike } = useSocialFeed();
  const [showSuggestions, setShowSuggestions] = useState(false);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </Card>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Community Feed</h2>
        <Link to="/friends">
          <Button variant="outline" size="sm">
            <Users className="h-4 w-4 mr-2" />
            Find Friends
          </Button>
        </Link>
      </div>

      {showSuggestions && <FriendSuggestions onClose={() => setShowSuggestions(false)} />}

      {feedPosts.map((post) => (
        <Card key={post.id} className="bg-gradient-card border-0 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" />
                <AvatarFallback className="bg-bridge-start text-white font-semibold">
                  {post.profiles?.display_name?.[0]?.toUpperCase() || post.profiles?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">
                    {post.profiles?.display_name || post.profiles?.username || "Anonymous"}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {post.profiles?.level || "Explorer"}
                  </Badge>
                  <span className="text-2xl ml-auto">{post.flag}</span>
                </div>
                
                <p className="text-muted-foreground mb-3">
                  {post.action_description}
                </p>
                
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-bridge-start" />
                    <span className="text-sm font-medium">+{post.points_earned} points</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-bridge-accent" />
                    <span className="text-sm font-medium">{post.streak_count} day streak</span>
                  </div>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>
                
                <div className="flex items-center gap-6 pt-3 border-t border-border">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => toggleLike(post.id)}
                  >
                    <Heart className="h-4 w-4 mr-1" />
                    {post.post_likes?.length || 0}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {post.post_comments?.length || 0}
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