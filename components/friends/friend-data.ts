export type Friend = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  role: string;
  location: string;
  bio: string;
  sharedShowcases: number;
};

export const DIRECTORY: Friend[] = [
  { id: "maya-carter", name: "Maya Carter", handle: "@mayacarter", initials: "MC", role: "Vocalist and songwriter", location: "Nashville, TN", bio: "Writing close harmonies, collecting field recordings, and making room for a good chorus.", sharedShowcases: 3 },
  { id: "devon-price", name: "Devon Price", handle: "@devonprice", initials: "DP", role: "Producer and multi-instrumentalist", location: "Chicago, IL", bio: "Producer focused on textured arrangements and collaborative demos.", sharedShowcases: 2 },
  { id: "jules-brown", name: "Jules Brown", handle: "@julesbrown", initials: "JB", role: "Mix engineer", location: "Portland, OR", bio: "Mixing independent projects with equal parts precision and curiosity.", sharedShowcases: 1 },
  { id: "riley-chen", name: "Riley Chen", handle: "@rileychen", initials: "RC", role: "Composer and pianist", location: "Brooklyn, NY", bio: "Building small worlds from piano sketches and patient listening.", sharedShowcases: 4 },
  { id: "samira-owens", name: "Samira Owens", handle: "@samiraowens", initials: "SO", role: "Singer and arranger", location: "Austin, TX", bio: "Arranging voices and finding the pulse in every song.", sharedShowcases: 1 },
];

export function findFriend(friendId: string) {
  return DIRECTORY.find((friend) => friend.id === friendId);
}