"use client";

import { useState } from "react";
import Link from "next/link";
import { SearchIcon, UserPlusIcon, UsersRoundIcon } from "lucide-react";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DIRECTORY, type Friend } from "@/components/friends/friend-data";

function matchesQuery(friend: Friend, query: string) {
  return `${friend.name} ${friend.handle} ${friend.role}`.toLowerCase().includes(query.toLowerCase());
}

function FriendCard({ friend, onRemove }: { friend: Friend; onRemove: (friendId: string) => void }) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3 p-4">
        <Avatar className="size-10"><AvatarFallback>{friend.initials}</AvatarFallback></Avatar>
        <Link href={`/friends/${friend.id}`} className="min-w-0 flex-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <h2 className="truncate font-semibold">{friend.name}</h2>
          <p className="truncate text-sm text-muted-foreground">{friend.role}</p>
        </Link>
        <Button variant="ghost" size="sm" onClick={() => onRemove(friend.id)}>Remove</Button>
      </CardContent>
    </Card>
  );
}

export function FriendsPageContent() {
  const [friends, setFriends] = useState(() => DIRECTORY.slice(0, 3));
  const [query, setQuery] = useState("");
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const visibleFriends = friends.filter((friend) => matchesQuery(friend, query));
  const directoryMembers = DIRECTORY.filter((friend) => matchesQuery(friend, directoryQuery));

  function addFriend(friend: Friend) {
    setFriends((currentFriends) => currentFriends.some(({ id }) => id === friend.id)
      ? currentFriends
      : [...currentFriends, friend]);
  }

  return (
    <StandardPageLayout
      eyebrow="Friends"
      title="Your collaborators"
      description="Keep your creative circle close and find people to share showcases with."
      actions={(
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild><Button><UserPlusIcon /> Add friend</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Find people</DialogTitle><DialogDescription>Search the OpenAux community and add collaborators to your circle.</DialogDescription></DialogHeader>
            <div className="relative"><SearchIcon className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" /><Input value={directoryQuery} onChange={(event) => setDirectoryQuery(event.target.value)} placeholder="Search by name or handle" className="pl-9" autoFocus /></div>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {directoryMembers.map((friend) => {
                const isFriend = friends.some(({ id }) => id === friend.id);
                return <div key={friend.id} className="flex items-center gap-3 rounded-lg border p-3"><Avatar className="size-9"><AvatarFallback>{friend.initials}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate font-medium">{friend.name}</p><p className="truncate text-sm text-muted-foreground">{friend.handle}</p></div><Button size="sm" variant={isFriend ? "secondary" : "default"} disabled={isFriend} onClick={() => addFriend(friend)}>{isFriend ? "Added" : "Add"}</Button></div>;
              })}
            </div>
          </DialogContent>
        </Dialog>
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{friends.length} friends</p><div className="relative w-full sm:w-72"><SearchIcon className="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your friends" className="pl-9" /></div></div>
      {visibleFriends.length > 0 ? (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-label="Your friends">{visibleFriends.map((friend) => <FriendCard key={friend.id} friend={friend} onRemove={(friendId) => setFriends((currentFriends) => currentFriends.filter(({ id }) => id !== friendId))} />)}</section>
      ) : (
        <Card><CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center"><UsersRoundIcon className="size-5 text-primary" /><div><h2 className="font-semibold">No matching friends</h2><p className="text-sm text-muted-foreground">Try a different name, or add someone from the community.</p></div></CardContent></Card>
      )}
      <section className="border-t pt-5" aria-labelledby="suggested-people-title">
        <div className="mb-3 flex items-center justify-between"><h2 id="suggested-people-title" className="font-semibold">Suggested collaborators</h2><Badge variant="outline">Community</Badge></div>
        <div className="grid gap-3 md:grid-cols-2">{DIRECTORY.slice(3).map((friend) => <Card key={friend.id} size="sm"><CardContent className="flex items-center gap-3 p-4"><Avatar className="size-10"><AvatarFallback>{friend.initials}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate font-semibold">{friend.name}</p><p className="truncate text-sm text-muted-foreground">{friend.sharedShowcases} shared showcases</p></div><Button size="sm" variant="outline" onClick={() => addFriend(friend)}>Add</Button></CardContent></Card>)}</div>
      </section>
    </StandardPageLayout>
  );
}