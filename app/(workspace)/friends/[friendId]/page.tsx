import { notFound } from "next/navigation";
import { FriendDetailContent } from "@/components/friends/friend-detail-content";
import { findFriend } from "@/components/friends/friend-data";

export default async function FriendPage({
  params,
}: {
  params: Promise<{ friendId: string }>;
}) {
  const { friendId } = await params;
  const friend = findFriend(friendId);

  if (!friend) {
    notFound();
  }

  return <FriendDetailContent friend={friend} />;
}