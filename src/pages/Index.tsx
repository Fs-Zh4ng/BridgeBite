import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation } from "@/components/Navigation";
import { DailyChallenge } from "@/components/DailyChallenge";
import { SocialFeed } from "@/components/SocialFeed";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-bridge.jpg";
import { Play, Star, Globe, Users, Trophy, Zap } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"challenge" | "feed">("challenge");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-white py-20 px-4 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="bg-white/20 text-white border-white/30 mb-4">
              🌟 2-Minute Cultural Exchanges
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Bridge
              <span className="bg-gradient-accent bg-clip-text text-transparent"> Cultures </span>
              in Bites
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Learn about the world through quick, fun daily challenges. No long calls, just bite-sized cultural exchanges that fit your day.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button variant="accent" size="lg" className="text-lg px-8 py-6">
              <Play className="mr-2 h-5 w-5" />
              Start Today's Challenge
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-white/10 border-white/30 text-white hover:bg-white/20">
              <Users className="mr-2 h-5 w-5" />
              Join Community
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="text-xl font-semibold mb-2">2-Minute Challenges</h3>
              <p className="text-white/80">Quick cultural moments that fit any schedule</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="text-xl font-semibold mb-2">Gamified Learning</h3>
              <p className="text-white/80">Earn points, badges, and maintain streaks</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="text-3xl mb-3">🌍</div>
              <h3 className="text-xl font-semibold mb-2">Global Community</h3>
              <p className="text-white/80">Connect with culture enthusiasts worldwide</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Join the Cultural Bridge</h2>
            <p className="text-lg text-muted-foreground">Thousands are already connecting cultures daily</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-bridge-start mb-2">12K+</div>
              <div className="text-muted-foreground">Active Learners</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-bridge-start mb-2">50+</div>
              <div className="text-muted-foreground">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-bridge-start mb-2">200+</div>
              <div className="text-muted-foreground">Daily Challenges</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-bridge-start mb-2">95%</div>
              <div className="text-muted-foreground">Complete Daily</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main App Interface */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-card rounded-lg p-2 border">
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "challenge" ? "default" : "ghost"}
                  onClick={() => setActiveTab("challenge")}
                  className="px-6"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  Daily Challenge
                </Button>
                <Button
                  variant={activeTab === "feed" ? "default" : "ghost"}
                  onClick={() => setActiveTab("feed")}
                  className="px-6"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Community
                </Button>
              </div>
            </div>
          </div>

          <div className="transition-all duration-300">
            {activeTab === "challenge" && <DailyChallenge />}
            {activeTab === "feed" && <SocialFeed />}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-hero text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Bridge Cultures?</h2>
          <p className="text-xl mb-8 opacity-90">
            Start your cultural journey today. Just 2 minutes a day to connect with the world.
          </p>
          <Button variant="accent" size="lg" className="text-lg px-12 py-6">
            <Zap className="mr-2 h-5 w-5" />
            Start Your First Challenge
          </Button>
          
          <div className="mt-12 flex items-center justify-center gap-8 text-sm opacity-80">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>50+ countries</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Global community</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-card border-t">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-gradient-hero p-2 rounded-lg">
              <span className="text-white font-bold text-xl">🌉</span>
            </div>
            <h3 className="text-xl font-bold">BridgeBites</h3>
          </div>
          <p className="text-muted-foreground">
            Connecting cultures, one bite at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;