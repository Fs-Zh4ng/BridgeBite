import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface FriendSuggestion {
  id: string; // profile id
  user_id: string;
  display_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  level?: string | null;
}

export const useFriends = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingIds, setRequestingIds] = useState<Record<string, boolean>>({});
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [processingRequestIds, setProcessingRequestIds] = useState<Record<string, boolean>>({});
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const fetchSuggestions = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch existing friendships involving the current user
    const { data: friendships, error: fErr } = await supabase
      .from("friendships")
      .select("user_id,friend_id,status")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (fErr) {
      console.error("Error fetching friendships:", fErr);
      setLoading(false);
      return;
    }

    const excludedUserIds = new Set<string>();
    excludedUserIds.add(user.id);

    (friendships || []).forEach((f: any) => {
      if (f.user_id) excludedUserIds.add(f.user_id);
      if (f.friend_id) excludedUserIds.add(f.friend_id);
    });

    // Fetch profiles excluding existing friends and self
    let query = supabase
      .from("profiles")
      .select("id,user_id,display_name,username,avatar_url,level")
      .limit(30);

    if (excludedUserIds.size) {
      const arr = Array.from(excludedUserIds).map((id) => id).join(",");
      // Use not with three args: column, operator, value
      query = supabase
        .from("profiles")
        .select("id,user_id,display_name,username,avatar_url,level")
        .not("user_id", "in", `(${arr})`)
        .limit(30);
    }

    const { data: profiles, error: pErr } = await query;

    if (pErr) {
      console.error("Error fetching profiles:", pErr);
      setLoading(false);
      return;
    }

    setSuggestions((profiles as any) || []);
    setLoading(false);
  };

  const sendFriendRequest = async (friendUserId: string) => {
    if (!user) return { error: new Error("Not authenticated") };
    setRequestingIds((s) => ({ ...s, [friendUserId]: true }));

    const { data, error } = await supabase.from("friendships").insert({
      user_id: user.id,
      friend_id: friendUserId,
      status: "pending",
    });

    setRequestingIds((s) => ({ ...s, [friendUserId]: false }));

    if (error) {
      console.error("Error sending friend request:", error);
      return { error };
    }

    // Optimistically remove requested user from suggestions
    setSuggestions((prev) => prev.filter((p) => p.user_id !== friendUserId));

    return { data };
  };

  const fetchIncomingRequests = async () => {
    if (!user) return;
    try {
      const { data: requests, error } = await supabase
        .from('friendships')
        .select('id,user_id,friend_id,status,created_at')
        .eq('friend_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching incoming friend requests:', error);
        return;
      }

      const requesterIds = (requests || []).map((r: any) => r.user_id);
      let profiles: any[] = [];
      if (requesterIds.length) {
        const { data: profs, error: pErr } = await supabase
          .from('profiles')
          .select('user_id,display_name,username,avatar_url,level')
          .in('user_id', requesterIds);
        if (pErr) console.error('Error fetching requester profiles:', pErr);
        profiles = profs || [];
      }

      const merged = (requests || []).map((r: any) => ({
        ...r,
        requester_profile: profiles.find((p) => p.user_id === r.user_id) || null,
      }));

      setIncomingRequests(merged);
    } catch (err) {
      console.error(err);
    }
  };

  const acceptRequest = async (requestId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    setProcessingRequestIds((s) => ({ ...s, [requestId]: true }));

    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .eq('friend_id', user.id);

    setProcessingRequestIds((s) => ({ ...s, [requestId]: false }));

    if (error) {
      console.error('Error accepting friend request:', error);
      return { error };
    }

    // Refresh requests and suggestions
    fetchIncomingRequests();
    fetchSuggestions();

    return {};
  };

  const declineRequest = async (requestId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    setProcessingRequestIds((s) => ({ ...s, [requestId]: true }));

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', requestId)
      .eq('friend_id', user.id);

    setProcessingRequestIds((s) => ({ ...s, [requestId]: false }));

    if (error) {
      console.error('Error declining friend request:', error);
      return { error };
    }

    fetchIncomingRequests();
    return {};
  };

  const fetchFriends = async () => {
    if (!user) return;
    setLoadingFriends(true);
    try {
      const { data: rels, error } = await supabase
        .from('friendships')
        .select('id,user_id,friend_id,created_at')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error fetching friends relationships:', error);
        setLoadingFriends(false);
        return;
      }

      const friendUserIds = (rels || []).map((r: any) => (r.user_id === user.id ? r.friend_id : r.user_id));

      let profiles: any[] = [];
      if (friendUserIds.length) {
        const { data: profs, error: pErr } = await supabase
          .from('profiles')
          .select('user_id,display_name,username,avatar_url,level')
          .in('user_id', friendUserIds);
        if (pErr) console.error('Error fetching friend profiles:', pErr);
        profiles = profs || [];
      }

      const merged = (rels || []).map((r: any) => ({
        friendship_id: r.id,
        created_at: r.created_at,
        user_id: r.user_id,
        friend_user_id: r.user_id === user.id ? r.friend_id : r.user_id,
        profile: profiles.find((p) => p.user_id === (r.user_id === user.id ? r.friend_id : r.user_id)) || null,
      }));

      setFriends(merged);
    } catch (err) {
      console.error(err);
    }
    setLoadingFriends(false);
  };

  const removeFriend = async (friendshipId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    try {
      const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
      if (error) {
        console.error('Error removing friend:', error);
        return { error };
      }
      // refresh lists
      fetchFriends();
      fetchSuggestions();
      return {};
    } catch (err) {
      console.error(err);
      return { error: err };
    }
  };

  useEffect(() => {
    fetchSuggestions();
    fetchIncomingRequests();
    fetchFriends();
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [user]);

   return {
     suggestions,
     loading,
     sendFriendRequest,
     requestingIds,
     incomingRequests,
     acceptRequest,
     declineRequest,
     processingRequestIds,
     friends,
     loadingFriends,
     removeFriend,
     refresh: fetchSuggestions,
   };
 };
