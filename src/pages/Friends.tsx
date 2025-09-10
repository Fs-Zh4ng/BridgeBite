import React from "react";
import { Navigation } from "@/components/Navigation";
import FriendSuggestions from "@/components/FriendSuggestions";
import { useAuth } from "@/hooks/useAuth";

const FriendsPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <div className="min-h-screen flex items-center justify-center">Please sign in to view friends.</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-6">Community</h1>
        <p className="mb-6 text-muted-foreground">Discover people, send friend requests, and grow your cultural network.</p>
        <FriendSuggestions onClose={() => { /* noop on page */ }} />
      </main>
    </div>
  );
};

export default FriendsPage;
