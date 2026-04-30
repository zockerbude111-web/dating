import { useState } from 'react';
import { useStore } from '../services/store';
import { FORUM_CATEGORIES } from '../types';
import type { ForumCategory } from '../types';
import Avatar from '../components/Avatar';
import { Heart, MessageCircle, Share2, Plus, X, Send } from 'lucide-react';

export default function CommunityFeedScreen() {
  const { forumPosts, forumCategory, setForumCategory, likePost, addForumPost, currentUser } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<ForumCategory>('smalltalk');

  const filtered = forumCategory === 'alle'
    ? forumPosts
    : forumPosts.filter(p => p.category === forumCategory);

  const handlePost = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    if (!currentUser?.premium) {
      alert('Forum-Threads erstellen ist nur für Premium-Nutzer verfügbar.');
      return;
    }
    addForumPost({ title: newTitle, content: newContent, category: newCategory });
    setNewTitle('');
    setNewContent('');
    setShowNew(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="pt-10 pb-4 px-5 glass-card border-b border-white/20">
        <h1 className="text-xl font-bold text-gray-800 mb-4">Community Feed</h1>
        
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {FORUM_CATEGORIES.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setForumCategory(key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all
                ${forumCategory === key
                  ? 'gradient-primary text-white shadow-md'
                  : 'bg-white text-gray-500 border border-gray-200'
                }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>

{/* Feed */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-4">
        {filtered.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            {/* Author */}
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={post.authorName} color={post.authorAvatar} size={36} verified={post.authorVerified} />
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-gray-800">{post.authorName}</span>
                </div>
                <span className="text-xs text-gray-400">{post.timestamp}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-primary-50 text-primary-600 text-[10px] font-semibold">
                {FORUM_CATEGORIES.find(c => c.key === post.category)?.icon}{' '}
                {FORUM_CATEGORIES.find(c => c.key === post.category)?.label}
              </span>
            </div>

            {/* Content */}
            <h3 className="font-semibold text-gray-800 text-sm mb-1">{post.title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">{post.content}</p>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-2 border-t border-gray-50">
              <button
                onClick={() => likePost(post.id)}
                className={`flex items-center gap-1.5 text-xs font-medium transition-all
                  ${post.liked ? 'text-coral-500' : 'text-gray-400 hover:text-coral-400'}`}
              >
                <Heart size={16} fill={post.liked ? 'currentColor' : 'none'} />
                {post.likes}
              </button>
              <button className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-primary-500">
                <MessageCircle size={16} />
                {post.comments}
              </button>
              <button className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-primary-500 ml-auto">
                <Share2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowNew(true)}
        className="fixed bottom-20 right-5 w-14 h-14 gradient-primary rounded-full shadow-xl shadow-primary-500/30 flex items-center justify-center z-40 active:scale-90 transition-transform"
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* New Post Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end">
          <div className="w-full bg-white rounded-t-3xl p-6 animate-fade-in-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Neuer Beitrag</h3>
              <button onClick={() => setShowNew(false)} className="p-1 text-gray-400">
                <X size={20} />
              </button>
            </div>

            {!currentUser?.premium && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-700 font-medium">⭐ Forum-Threads erstellen ist ein Premium-Feature (4,99€/Monat)</p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {FORUM_CATEGORIES.filter(c => c.key !== 'alle').map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setNewCategory(key as ForumCategory)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
                      ${newCategory === key ? 'gradient-primary text-white' : 'bg-gray-100 text-gray-500'}`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
              <input
                placeholder="Titel deines Beitrags"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
              <textarea
                placeholder="Was möchtest du teilen?"
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={4}
                className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none"
              />
              <button
                onClick={handlePost}
                className="w-full py-3 gradient-primary text-white font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <Send size={16} />
                Veröffentlichen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
