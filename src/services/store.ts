import { create } from 'zustand';
import type {
  UserProfile, AppScreen, MainTab, AccessibilityBadge,
  DatingIntention, ForumPost, ChatMessage, MatchProfile, Gender
} from '../types';

const AVATAR_COLORS = ['#7c3aed', '#f43f5e', '#14b8a6', '#f59e0b', '#3b82f6', '#ec4899', '#10b981'];

function randomAvatar(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

const MOCK_NAMES_M = ['Lukas', 'Felix', 'Jonas', 'Leon', 'Maximilian', 'Ben', 'Elias', 'Paul', 'Noah', 'Tim'];
const MOCK_NAMES_F = ['Anna', 'Lena', 'Sophie', 'Marie', 'Laura', 'Emma', 'Mia', 'Clara', 'Hannah', 'Lea'];
const MOCK_CITIES = ['Berlin', 'München', 'Hamburg', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig'];
const MOCK_INTERESTS = ['Musik', 'Kochen', 'Reisen', 'Fotografie', 'Gaming', 'Wandern', 'Lesen', 'Yoga', 'Kunst', 'Film', 'Sport', 'Tanzen', 'Natur', 'Technik', 'Meditation'];
const MOCK_VALUES = ['Ehrlichkeit', 'Empathie', 'Humor', 'Treue', 'Offenheit', 'Respekt', 'Geduld', 'Kreativität'];
const MOCK_GOALS = ['Familie gründen', 'Reisen', 'Karriere', 'Selbstfindung', 'Ehrenamt', 'Abenteuer'];
const ALL_BADGES: AccessibilityBadge[] = ['wheelchair', 'signlanguage', 'assistdog', 'neurodivergent', 'spoonie'];
const ALL_INTENTIONS: DatingIntention[] = ['friendship', 'casual', 'relationship', 'community'];
const COMM_STYLES = ['Direkt & ehrlich', 'Einfühlsam', 'Humorvoll', 'Geduldig', 'Aufmerksam'];

function pickRandom<T>(arr: T[], min: number, max: number): T[] {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateMockUsers(count: number): UserProfile[] {
  return Array.from({ length: count }, (_, i) => {
    const isFemale = Math.random() > 0.5;
    const names = isFemale ? MOCK_NAMES_F : MOCK_NAMES_M;
    return {
      id: `user-${i + 1}`,
      name: names[i % names.length],
      age: 20 + Math.floor(Math.random() * 35),
      email: `user${i}@amara.de`,
      verified: Math.random() > 0.3,
      premium: Math.random() > 0.7,
      gender: (isFemale ? 'female' : 'male') as Gender,
      bio: 'Hey! Ich bin hier um neue Menschen kennenzulernen. Offen für alles was das Leben bringt 💜',
      city: MOCK_CITIES[Math.floor(Math.random() * MOCK_CITIES.length)],
      badges: pickRandom(ALL_BADGES, 1, 3),
      intentions: pickRandom(ALL_INTENTIONS, 1, 2),
      interests: pickRandom(MOCK_INTERESTS, 3, 6),
      photos: [],
      avatar: randomAvatar(),
      values: pickRandom(MOCK_VALUES, 2, 4),
      communicationStyle: COMM_STYLES[Math.floor(Math.random() * COMM_STYLES.length)],
      lifeGoals: pickRandom(MOCK_GOALS, 1, 3),
    };
  });
}

function calcSoulScore(user: UserProfile, other: UserProfile): number {
  let score = 0;
  const maxScore = 100;
  const commonBadges = user.badges.filter(b => other.badges.includes(b));
  score += commonBadges.length * 12;
  const commonInterests = user.interests.filter(i => other.interests.includes(i));
  score += commonInterests.length * 8;
  const commonIntentions = user.intentions.filter(i => other.intentions.includes(i));
  score += commonIntentions.length * 10;
  const commonValues = user.values.filter(v => other.values.includes(v));
  score += commonValues.length * 7;
  const commonGoals = user.lifeGoals.filter(g => other.lifeGoals.includes(g));
  score += commonGoals.length * 6;
  if (user.communicationStyle === other.communicationStyle) score += 5;
  return Math.min(score, maxScore);
}

const mockUsers = generateMockUsers(20);

const MOCK_POSTS: ForumPost[] = [
  { id: 'p1', authorId: 'user-1', authorName: 'Lukas', authorAvatar: '#7c3aed', authorVerified: true, category: 'support', title: 'Erste Erfahrungen mit der App', content: 'Bin total begeistert! Endlich eine Plattform wo man sich verstanden fühlt. Wie geht es euch so? 💜', likes: 24, comments: 8, timestamp: 'vor 2 Std.', liked: false },
  { id: 'p2', authorId: 'user-3', authorName: 'Sophie', authorAvatar: '#f43f5e', authorVerified: true, category: 'liebe', title: 'Dating-Tipps für Rollstuhlfahrer?', content: 'Habt ihr Erfahrungen mit barrierefreien Date-Locations? Welche Restaurants/Cafés könnt ihr empfehlen?', likes: 31, comments: 12, timestamp: 'vor 4 Std.', liked: false },
  { id: 'p3', authorId: 'user-5', authorName: 'Emma', authorAvatar: '#14b8a6', authorVerified: false, category: 'smalltalk', title: 'Sonntagsmood ☀️', content: 'Was macht ihr heute Schönes? Ich genieße den Tag mit meinem Assistenzhund im Park 🦮', likes: 45, comments: 15, timestamp: 'vor 5 Std.', liked: false },
  { id: 'p4', authorId: 'user-2', authorName: 'Felix', authorAvatar: '#f59e0b', authorVerified: true, category: 'politik', title: 'Barrierefreiheit im ÖPNV', content: 'München plant neue barrierefreie U-Bahn-Stationen. Was denkt ihr darüber? Reicht das?', likes: 18, comments: 6, timestamp: 'vor 8 Std.', liked: false },
  { id: 'p5', authorId: 'user-7', authorName: 'Clara', authorAvatar: '#ec4899', authorVerified: true, category: 'support', title: 'Neurodivergenz & Beziehungen', content: 'Wie erklärt ihr eurem Partner eure Bedürfnisse? Ich finde das manchmal echt schwierig... 🧠', likes: 52, comments: 21, timestamp: 'vor 1 Tag', liked: false },
];

const MOCK_CHAT: ChatMessage[] = [
  { id: 'c1', senderId: 'user-1', senderName: 'Lukas', senderAvatar: '#7c3aed', content: 'Guten Morgen zusammen! ☀️', timestamp: '09:15', type: 'text' },
  { id: 'c2', senderId: 'user-3', senderName: 'Sophie', senderAvatar: '#f43f5e', content: 'Moin! Wer ist heute alles online? 👋', timestamp: '09:18', type: 'text' },
  { id: 'c3', senderId: 'user-5', senderName: 'Emma', senderAvatar: '#14b8a6', content: 'Bin da! Was geht heute?', timestamp: '09:20', type: 'text' },
  { id: 'c4', senderId: 'user-2', senderName: 'Felix', senderAvatar: '#f59e0b', content: 'Hat jemand Lust auf eine Runde Schach? ♟️', timestamp: '09:25', type: 'text' },
  { id: 'c5', senderId: 'user-8', senderName: 'Hannah', senderAvatar: '#3b82f6', content: 'Ja gerne! Wer fängt an?', timestamp: '09:27', type: 'text' },
];

const BAD_WORDS = ['idiot', 'dumm', 'blöd', 'scheiße', 'arsch', 'fick', 'hure', 'missgeburt', 'behindert', 'spast'];

function filterBadWords(text: string): string {
  let filtered = text;
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '*'.repeat(word.length));
  });
  // Filter emails
  filtered = filtered.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '[Email entfernt]');
  // Filter phone numbers (German formats)
  filtered = filtered.replace(/(?:\+49|0049|0)\s*[1-9][0-9\s-]{6,}/g, '[Telefonnummer entfernt]');
  // Filter links/URLs
  filtered = filtered.replace(/(?:https?:\/\/|www\.)[^\s]+/gi, '[Link entfernt]');
  return filtered;
}

interface AppState {
  screen: AppScreen;
  activeTab: MainTab;
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  forumPosts: ForumPost[];
  chatMessages: ChatMessage[];
  matchQueue: MatchProfile[];
  matchIndex: number;
  likedProfiles: string[];
  searchGenderFilter: Gender | 'all';
  forumCategory: string;
  lastChatTime: number;
  privateChatTarget: UserProfile | null;
  privateChatMessages: Record<string, ChatMessage[]>;
  profileViewers: string[];

  setScreen: (s: AppScreen) => void;
  setActiveTab: (t: MainTab) => void;
  register: (name: string, email: string, password: string) => void;
  setAdminUser: (name: string) => void;
  setupProfile: (data: Partial<UserProfile>) => void;
  setForumCategory: (c: string) => void;
  likePost: (postId: string) => void;
  addForumPost: (post: Omit<ForumPost, 'id' | 'authorId' | 'authorName' | 'authorAvatar' | 'authorVerified' | 'likes' | 'comments' | 'timestamp' | 'liked'>) => void;
  swipeRight: () => void;
  swipeLeft: () => void;
  sendChatMessage: (content: string) => boolean;
  setSearchGenderFilter: (g: Gender | 'all') => void;
  setPrivateChatTarget: (u: UserProfile | null) => void;
  sendPrivateMessage: (targetId: string, content: string) => void;
  togglePremium: () => void;
  verify: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  screen: 'splash',
  activeTab: 'community',
  currentUser: null,
  allUsers: mockUsers,
  forumPosts: MOCK_POSTS,
  chatMessages: MOCK_CHAT,
  matchQueue: [],
  matchIndex: 0,
  likedProfiles: [],
  searchGenderFilter: 'all',
  forumCategory: 'alle',
  lastChatTime: 0,
  privateChatTarget: null,
  privateChatMessages: {},
  profileViewers: ['user-1', 'user-3', 'user-5', 'user-2', 'user-3'],

  setScreen: (screen) => set({ screen }),
  setActiveTab: (activeTab) => set({ activeTab }),
  
  register: (name, email) => {
    const user: UserProfile = {
      id: 'current-user',
      name,
      email,
      age: 25,
      verified: false,
      premium: false,
      gender: 'other',
      bio: '',
      city: '',
      badges: [],
      intentions: [],
      interests: [],
      photos: [],
      avatar: randomAvatar(),
      values: [],
      communicationStyle: '',
      lifeGoals: [],
    };
    set({ currentUser: user, screen: 'profile-setup' });
  },

  // Admin login - skip registration with premium
  setAdminUser: (name: string) => {
    const adminUser: UserProfile = {
      id: 'admin-user',
      name,
      email: 'admin@amara.de',
      age: 25,
      verified: true,
      premium: true,
      gender: 'other',
      bio: 'Admin Account - Free Premium',
      city: 'Berlin',
      badges: ['wheelchair', 'signlanguage'],
      intentions: ['community'],
      interests: ['All'],
      photos: [],
      avatar: '#7c3aed',
      values: [],
      communicationStyle: '',
      lifeGoals: [],
    };
    const matches: MatchProfile[] = mockUsers
      .map(u => ({
        ...u,
        soulScore: calcSoulScore(adminUser, u),
        commonBadges: adminUser.badges.filter(b => u.badges.includes(b)),
        commonInterests: adminUser.interests.filter(i => u.interests.includes(i)),
        commonIntentions: adminUser.intentions.filter(i => u.intentions.includes(i)),
        distance: 5 + Math.floor(Math.random() * 45),
      }))
      .sort((a, b) => b.soulScore - a.soulScore);
    set({ currentUser: adminUser, matchQueue: matches, matchIndex: 0, screen: 'main' });
  },

  setupProfile: (data) => {
    const { currentUser, allUsers } = get();
    if (!currentUser) return;
    const updated = { ...currentUser, ...data };
    const matches: MatchProfile[] = allUsers
      .map(u => ({
        ...u,
        soulScore: calcSoulScore(updated, u),
        commonBadges: updated.badges.filter(b => u.badges.includes(b)),
        commonInterests: updated.interests.filter(i => u.interests.includes(i)),
        commonIntentions: updated.intentions.filter(i => u.intentions.includes(i)),
        distance: 5 + Math.floor(Math.random() * 45),
      }))
      .sort((a, b) => b.soulScore - a.soulScore);
    set({ currentUser: updated, matchQueue: matches, matchIndex: 0, screen: 'main' });
  },

  setForumCategory: (forumCategory) => set({ forumCategory }),
  
  likePost: (postId) => set(state => ({
    forumPosts: state.forumPosts.map(p =>
      p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ),
  })),

  addForumPost: (post) => {
    const { currentUser } = get();
    if (!currentUser) return;
    const newPost: ForumPost = {
      ...post,
      id: `p-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      authorVerified: currentUser.verified,
      likes: 0,
      comments: 0,
      timestamp: 'gerade eben',
      liked: false,
    };
    set(state => ({ forumPosts: [newPost, ...state.forumPosts] }));
  },

  swipeRight: () => {
    const { matchIndex, matchQueue } = get();
    if (matchIndex < matchQueue.length) {
      set(state => ({
        likedProfiles: [...state.likedProfiles, matchQueue[matchIndex].id],
        matchIndex: matchIndex + 1,
      }));
    }
  },

  swipeLeft: () => {
    const { matchIndex, matchQueue } = get();
    if (matchIndex < matchQueue.length) {
      set({ matchIndex: matchIndex + 1 });
    }
  },

  sendChatMessage: (content) => {
    const { currentUser, lastChatTime } = get();
    if (!currentUser) return false;
    const now = Date.now();
    if (now - lastChatTime < 30000) return false;
    const filtered = filterBadWords(content);
    const msg: ChatMessage = {
      id: `c-${now}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: filtered,
      timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
    };
    set(state => ({
      chatMessages: [...state.chatMessages, msg],
      lastChatTime: now,
    }));
    return true;
  },

  setSearchGenderFilter: (searchGenderFilter) => set({ searchGenderFilter }),

  setPrivateChatTarget: (privateChatTarget) => set({ privateChatTarget }),

  sendPrivateMessage: (targetId, content) => {
    const { currentUser } = get();
    if (!currentUser) return;
    const filtered = filterBadWords(content);
    const msg: ChatMessage = {
      id: `pm-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      content: filtered,
      timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
    };
    set(state => ({
      privateChatMessages: {
        ...state.privateChatMessages,
        [targetId]: [...(state.privateChatMessages[targetId] || []), msg],
      },
    }));
  },

  togglePremium: () => set(state => ({
    currentUser: state.currentUser ? { ...state.currentUser, premium: !state.currentUser.premium } : null,
  })),

  verify: () => set(state => ({
    currentUser: state.currentUser ? { ...state.currentUser, verified: true } : null,
  })),
}));
