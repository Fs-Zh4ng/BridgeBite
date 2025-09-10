import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: string;
  country: string;
  flag: string;
  points: number;
  difficulty: string;
  options?: any;
  correct_answer?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  level: string;
  total_points: number;
  current_streak: number;
  max_streak: number;
  countries_bridged: string[];
}

export const useChallenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [dailyChallenge, setDailyChallenge] = useState<Challenge | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user profile
  const fetchUserProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setUserProfile(data);
  };

  // Fetch all challenges
  const fetchChallenges = async () => {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching challenges:', error);
      return;
    }

    setChallenges(data || []);
    
    // Set a random challenge as daily challenge
    if (data && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length);
      setDailyChallenge(data[randomIndex]);
    }
  };

  // Complete a challenge
  const completeChallenge = async (
    challengeId: string, 
    userAnswer: string, 
    isCorrect: boolean,
    pointsEarned: number
  ) => {
    if (!user || !userProfile) return false;

    try {
      // Record challenge completion
      const { error: completionError } = await supabase
        .from('user_challenges')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          user_answer: userAnswer,
          is_correct: isCorrect,
          points_earned: pointsEarned
        });

      if (completionError) {
        console.error('Error recording completion:', completionError);
        return false;
      }

      // Update user stats
      const newStreak = userProfile.current_streak + 1;
      const newPoints = userProfile.total_points + pointsEarned;
      const challenge = challenges.find(c => c.id === challengeId);
      const newCountries = challenge && !userProfile.countries_bridged.includes(challenge.country) 
        ? [...userProfile.countries_bridged, challenge.country]
        : userProfile.countries_bridged;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          total_points: newPoints,
          current_streak: newStreak,
          max_streak: Math.max(newStreak, userProfile.max_streak),
          countries_bridged: newCountries
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        return false;
      }

      // Create feed post
      if (challenge) {
        const { error: feedError } = await supabase
          .from('feed_posts')
          .insert({
            user_id: user.id,
            challenge_id: challengeId,
            action_type: 'challenge_completed',
            action_description: `completed the ${challenge.title}`,
            points_earned: pointsEarned,
            streak_count: newStreak,
            country: challenge.country,
            flag: challenge.flag
          });

        if (feedError) {
          console.error('Error creating feed post:', feedError);
        }
      }

      // Update local state
      setUserProfile({
        ...userProfile,
        total_points: newPoints,
        current_streak: newStreak,
        max_streak: Math.max(newStreak, userProfile.max_streak),
        countries_bridged: newCountries
      });

      toast({
        title: "Challenge Complete!",
        description: `+${pointsEarned} points earned. Streak: ${newStreak} days!`,
      });

      return true;
    } catch (error) {
      console.error('Error completing challenge:', error);
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchUserProfile(), fetchChallenges()]).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  return {
    challenges,
    dailyChallenge,
    userProfile,
    loading,
    completeChallenge,
    refetchProfile: fetchUserProfile
  };
};