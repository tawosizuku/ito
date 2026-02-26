import { useSocket } from './hooks/useSocket';
import { useGame } from './context/GameContext';
import { HomeScreen } from './screens/HomeScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { GameScreen } from './screens/GameScreen';
import styles from './App.module.css';

export function AppContent() {
  useSocket();
  const { state } = useGame();

  const { connection, room, game } = state;

  // Determine which screen to show
  const screen = (() => {
    if (!room.roomCode) return 'home';
    if (game.phase === 'WAITING' || game.phase === 'LOBBY') return 'lobby';
    return 'game';
  })();

  return (
    <>
      {/* Connection status banner */}
      {connection.isReconnecting && (
        <div className={styles.reconnecting}>
          再接続中...
        </div>
      )}

      {screen === 'home' && <HomeScreen />}
      {screen === 'lobby' && <LobbyScreen />}
      {screen === 'game' && <GameScreen />}
    </>
  );
}
