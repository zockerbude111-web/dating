export type AccessibilityBadge = 'wheelchair' | 'signlanguage' | 'assistdog' | 'neurodivergent' | 'spoonie';

export const BADGE_INFO: Record<AccessibilityBadge, { icon: string; label: string }> = {
  wheelchair: { icon: '♿', label: 'Rollstuhl' },
  signlanguage: { icon: '🦻', label: 'Gebärdensprache' },
  assistdog: { icon: '🦮', label: 'Assistenzhund' },
  neurodivergent: { icon: '🧠', label: 'Neurodivergent' },
  spoonie: { icon: '🔋', label: 'Chronische Erkrankung' },
};

export type DatingIntention = 'friendship' | 'casual' | 'relationship' | 'community';

export const INTENTION_INFO: Record<DatingIntention, { icon: string; label: string }> = {
  friendship: { icon: '🤝', label: 'Freundschaft' },
  casual: { icon: '☕', label: 'Lockeres Dating' },
  relationship: { icon: '❤️', label: 'Feste Beziehung' },
  community: { icon: '🌍', label: 'Community-Austausch' },
};

export type Gender = 'male' | 'female' | 'nonbinary' | 'other';

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  email: string;
  phone?: string;
  verified: boolean;
  premium: boolean;
  gender: Gender;
  bio: string;
  city: string;
  badges: AccessibilityBadge[];
  intentions: DatingIntention[];
  interests: string[];
  photos: string[];
  avatar: string;
  values: string[];
  communicationStyle: string;
  lifeGoals: string[];
}

export interface ForumPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorVerified: boolean;
  category: ForumCategory;
  title: string;
  content: string;
  likes: number;
  comments: number;
  timestamp: string;
  liked: boolean;
}

export type ForumCategory = 'alle' | 'liebe' | 'smalltalk' | 'support' | 'politik';

export const FORUM_CATEGORIES: { key: ForumCategory; label: string; icon: string }[] = [
  { key: 'alle', label: 'Alle', icon: '🌐' },
  { key: 'liebe', label: 'Liebe', icon: '💕' },
  { key: 'smalltalk', label: 'Small Talk', icon: '💬' },
  { key: 'support', label: 'Support', icon: '🤗' },
  { key: 'politik', label: 'Politik & Wirtschaft', icon: '📰' },
];

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  type: 'text' | 'emoji' | 'gif';
}

export interface MatchProfile extends UserProfile {
  soulScore: number;
  commonBadges: AccessibilityBadge[];
  commonInterests: string[];
  commonIntentions: DatingIntention[];
  distance: number;
}

export type MiniGame = 'chess' | 'billiard' | 'volleyball' | 'mafia';

export const MINIGAME_INFO: Record<MiniGame, { name: string; icon: string; desc: string; players: string }> = {
  chess: { name: 'Schach', icon: '♟️', desc: 'Klassisches Strategiespiel', players: '2 Spieler' },
  billiard: { name: '8ball Pool', icon: '🎱', desc: 'Knuddels 8ball-Style', players: '2 Spieler' },
  volleyball: { name: 'Beach Volleyball', icon: '🏐', desc: 'Blobby Volley Style', players: '2 Spieler' },
  mafia: { name: 'Mafia', icon: '🕵️‍♂️', desc: 'Finde die Mafiosi', players: '4-8 Spieler' },
};

export type AppScreen = 
  | 'splash'
  | 'auth'
  | 'profile-setup'
  | 'main';

export type MainTab = 'community' | 'matching' | 'chat' | 'search' | 'games' | 'profile';
