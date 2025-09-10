import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, MapPin, Settings } from "lucide-react";

export const Navigation = () => {
  const [currentPoints] = useState(285);
  const [currentLevel] = useState("Bridge Builder");

  return (
    <nav className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-hero p-2 rounded-lg">
              <span className="text-white font-bold text-xl">🌉</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">BridgeBites</h1>
              <p className="text-xs text-muted-foreground">Cultural Exchange</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-6">
            <Button variant="ghost" size="sm">
              <Trophy className="h-4 w-4 mr-2" />
              Challenges
            </Button>
            <Button variant="ghost" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Community
            </Button>
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
                  {currentLevel}
                </Badge>
                <span className="text-sm font-semibold text-bridge-start">
                  {currentPoints} pts
                </span>
              </div>
            </div>
            
            <Avatar className="h-8 w-8">
              <AvatarImage src="" />
              <AvatarFallback className="bg-bridge-start text-white text-sm font-semibold">
                YU
              </AvatarFallback>
            </Avatar>
            
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};