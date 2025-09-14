import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface FeedPost {
  id: string;
  user_id: string;
  action_description: string;
  points_earned: number;
  streak_count: number;
  country?: string;
  flag?: string;
  created_at: string;
  profiles: {
    username?: string;
    display_name?: string;
    level?: string;
  } | null;
  post_likes: { id: string }[];
  post_comments: { id: string }[];
}

export const useSocialFeed = () => {
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchFeedPosts = async () => {
    const { data, error } = await supabase
      .from('feed_posts')
      .select(`
        *,
        profiles!feed_posts_user_id_fkey(username, display_name, level),
        post_likes(id),
        post_comments(id)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching feed posts:', error);
      return;
    }

    setFeedPosts((data as Array<{ id: string; user_id: string; content: string; created_at: string; likes: number; is_liked: boolean; profile?: { display_name?: string; username?: string; avatar_url?: string } }>) || []);
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_id', postId)
      .maybeSingle();

    if (existingLike) {
      // Unlike
      await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);
    } else {
      // Like
      await supabase
        .from('post_likes')
        .insert({
          user_id: user.id,
          post_id: postId
        });
    }

    // Refresh feed
    fetchFeedPosts();
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('post_comments')
      .insert({
        user_id: user.id,
        post_id: postId,
        content
      });

    if (!error) {
      fetchFeedPosts();
    }
  };

  useEffect(() => {
    fetchFeedPosts().finally(() => setLoading(false));

    // Set up real-time subscription
    const channel = supabase
      .channel('feed-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feed_posts'
        },
        () => fetchFeedPosts()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_likes'
        },
        () => fetchFeedPosts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    feedPosts,
    loading,
    toggleLike,
    addComment,
    refetch: fetchFeedPosts
  };
};