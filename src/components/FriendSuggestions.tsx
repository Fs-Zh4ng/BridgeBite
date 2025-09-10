import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFriends } from "@/hooks/useFriends";

export const FriendSuggestions: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { suggestions, loading, sendFriendRequest, requestingIds, incomingRequests, acceptRequest, declineRequest, processingRequestIds, friends, loadingFriends, removeFriend } = useFriends();

  return (
    <div className="w-full">
      {/* Your Friends */}
      <div className="mb-6">
        <h4 className="text-md font-semibold mb-3">Your Friends</h4>
        {loadingFriends ? (
          <div className="p-4">Loading friends...</div>
        ) : (
          <div className="space-y-3">
            {friends.length === 0 && <div className="text-sm text-muted-foreground">You have no friends yet.</div>}
            {friends.map((f: any) => (
              <Card key={f.friendship_id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={f.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-bridge-start text-white font-semibold">
                      {(f.profile?.display_name || f.profile?.username || 'U')[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{f.profile?.display_name || f.profile?.username || 'Unknown'}</div>
                    <div className="text-sm text-muted-foreground">Friends since {new Date(f.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div>
                  <Button size="sm" variant="ghost" onClick={() => removeFriend(f.friendship_id)}>Remove</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Incoming requests */}
      {incomingRequests.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-3">Incoming Requests</h4>
          <div className="space-y-3">
            {incomingRequests.map((req: any) => (
              <Card key={req.id} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={req.requester_profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-bridge-start text-white font-semibold">
                      {(req.requester_profile?.display_name || req.requester_profile?.username || 'U')[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{req.requester_profile?.display_name || req.requester_profile?.username || 'Unknown'}</div>
                    <div className="text-sm text-muted-foreground">Requested {new Date(req.created_at).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="default" onClick={() => acceptRequest(req.id)} disabled={!!processingRequestIds[req.id]}>Accept</Button>
                  <Button size="sm" variant="ghost" onClick={() => declineRequest(req.id)} disabled={!!processingRequestIds[req.id]}>Decline</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">People You May Know</h3>
      </div>

      {loading ? (
        <div className="p-8 text-center">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {suggestions.length === 0 && (
            <div className="col-span-full text-center p-6">No suggestions right now.</div>
          )}

          {suggestions.map((s) => (
            <Card key={s.id} className="p-4 flex items-center gap-4">
              <CardContent className="flex items-center gap-4 p-0">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={s.avatar_url || undefined} />
                  <AvatarFallback className="bg-bridge-start text-white font-semibold">
                    {(s.display_name || s.username || "U")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 ml-2">
                  <div className="font-semibold">{s.display_name || s.username || "Unnamed"}</div>
                  <div className="text-sm text-muted-foreground">{s.level || "Explorer"}</div>
                </div>

                <div>
                  <Button
                    size="sm"
                    onClick={() => sendFriendRequest(s.user_id)}
                    disabled={!!requestingIds[s.user_id]}
                  >
                    {requestingIds[s.user_id] ? "Requesting..." : "Add Friend"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendSuggestions;
