import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, MapPin, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useChallenges } from "@/hooks/useChallenges";
import { useNavigate, Link } from "react-router-dom";

export const Navigation = () => {
  const { user, signOut } = useAuth();
  const { userProfile } = useChallenges();
  const navigate = useNavigate();

  return (
    <nav className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="bg-gradient-hero p-2 rounded-lg">
              <span className="text-white font-bold text-xl">🌉</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">BridgeBites</h1>
              <p className="text-xs text-muted-foreground">Cultural Exchange</p>
            </div>
          </Link>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-6">
            <Button variant="ghost" size="sm">
              <Trophy className="h-4 w-4 mr-2" />
              Challenges
            </Button>
            <Link to="/friends">
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Community
              </Button>
            </Link>
            <Button variant="ghost" size="sm">
              <MapPin className="h-4 w-4 mr-2" />
              Bridge Map
            </Button>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {userProfile?.level || "Explorer"}
                </Badge>
                <span className="text-sm font-semibold text-bridge-start">
                  {userProfile?.total_points || 0} pts
                </span>
              </div>
            </div>
            
            <Avatar className="h-8 w-8">
              <AvatarImage src={userProfile?.avatar_url || ""} />
              <AvatarFallback className="bg-bridge-start text-white text-sm font-semibold">
                {userProfile?.display_name?.[0]?.toUpperCase() || userProfile?.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              onClick={async () => {
                await signOut();
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};