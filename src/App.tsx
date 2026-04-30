import { useStore } from './services/store';
import SplashScreen from './screens/SplashScreen';
import AuthScreen from './screens/AuthScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import CommunityFeedScreen from './screens/CommunityFeedScreen';
import MatchingScreen from './screens/MatchingScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileSearchScreen from './screens/ProfileSearchScreen';
import MiniGamesScreen from './screens/MiniGamesScreen';
import ProfileScreen from './screens/ProfileScreen';
import BottomNav from './components/BottomNav';

function MainScreen() {
  const activeTab = useStore(s => s.activeTab);

  return (
    <div className="h-full relative">
      <div className="h-full">
        {activeTab === 'community' && <CommunityFeedScreen />}
        {activeTab === 'matching' && <MatchingScreen />}
        {activeTab === 'chat' && <ChatScreen />}
        {activeTab === 'search' && <ProfileSearchScreen />}
        {activeTab === 'games' && <MiniGamesScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </div>
      <BottomNav />
    </div>
  );
}

export default function App() {
  const screen = useStore(s => s.screen);

  return (
    <div className="h-screen max-w-lg mx-auto relative bg-gradient-to-br from-[#f5f3ff] via-[#fdf2f8] to-[#f0fdf4] overflow-hidden">
      {screen === 'splash' && <SplashScreen />}
      {screen === 'auth' && <AuthScreen />}
      {screen === 'profile-setup' && <ProfileSetupScreen />}
      {screen === 'main' && <MainScreen />}
    </div>
  );
}
