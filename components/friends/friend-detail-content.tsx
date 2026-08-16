"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, MailIcon, UserMinusIcon, UserPlusIcon } from "lucide-react";
import type { Friend } from "@/components/friends/friend-data";
import { StandardPageLayout } from "@/components/layout/standard-page-layout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FriendDetailContent({ friend }: { friend: Friend }) {
  const [isFriend, setIsFriend] = useState(true);

  return (
    <StandardPageLayout
      eyebrow="Community member"
      title={friend.name}
      description={friend.role}
      actions={<Button variant={isFriend ? "outline" : "default"} onClick={() => setIsFriend((currentValue) => !currentValue)}>{isFriend ? <UserMinusIcon /> : <UserPlusIcon />}{isFriend ? "Remove friend" : "Add friend"}</Button>}
    >
      <Button asChild variant="ghost" className="w-fit"><Link href="/friends"><ArrowLeftIcon /> Back to friends</Link></Button>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card><CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start"><Avatar className="size-20"><AvatarFallback className="text-xl">{friend.initials}</AvatarFallback></Avatar><div className="min-w-0 space-y-3"><div><h2 className="text-xl font-bold">{friend.name}</h2><p className="text-muted-foreground">{friend.handle}</p></div><p className="max-w-2xl text-sm leading-6 text-foreground/75">{friend.bio}</p><Badge variant="secondary">{friend.location}</Badge></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Connection</CardTitle></CardHeader><CardContent className="space-y-3"><div><p className="text-2xl font-bold">{friend.sharedShowcases}</p><p className="text-sm text-muted-foreground">shared showcases</p></div><Button className="w-full" variant="outline" disabled={!isFriend}><MailIcon /> Message</Button></CardContent></Card>
      </section>
    </StandardPageLayout>
  );
}