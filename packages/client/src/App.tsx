import { GameProvider } from './context/GameContext';
import { AppContent } from './AppContent';

export function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
