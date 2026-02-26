import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import type { AppState, Action } from './types';
import { initialState } from './types';
import { gameReducer } from './gameReducer';

interface GameContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return ctx;
}
