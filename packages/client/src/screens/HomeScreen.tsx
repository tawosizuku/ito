import { useState, type FormEvent } from 'react';
import { validatePlayerName, validateRoomCode, PLAYER_NAME_MAX_LENGTH } from '@ito/shared';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useGameActions } from '../hooks/useGameActions';
import { useGame } from '../context/GameContext';
import styles from './HomeScreen.module.css';

export function HomeScreen() {
  const { state } = useGame();
  const { createRoom, joinRoom, clearError } = useGameActions();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    const err = validatePlayerName(name);
    if (err) {
      setNameError(err);
      return;
    }
    setNameError(null);
    try {
      await createRoom(name.trim());
    } catch {
      // Error handled in dispatch
    }
  };

  const handleJoin = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    const nameErr = validatePlayerName(name);
    const codeErr = validateRoomCode(roomCode);
    if (nameErr || codeErr) {
      setNameError(nameErr);
      setCodeError(codeErr);
      return;
    }
    setNameError(null);
    setCodeError(null);
    try {
      await joinRoom(roomCode, name.trim());
    } catch {
      // Error handled in dispatch
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>ito</h1>
        <p className={styles.subtitle}>カードの数字を声に出さずに、小さい順に出そう！</p>

        {state.ui.error && (
          <div className={styles.errorBanner}>{state.ui.error}</div>
        )}

        <div className={styles.form}>
          <Input
            label="プレイヤー名"
            placeholder="名前を入力"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={PLAYER_NAME_MAX_LENGTH}
            error={nameError}
          />

          <div className={styles.actions}>
            <Button
              onClick={handleCreate}
              disabled={state.ui.isLoading || !state.connection.isConnected}
              size="lg"
            >
              ルームを作成
            </Button>
          </div>

          <div className={styles.divider}>
            <span>または</span>
          </div>

          <Input
            label="ルームコード"
            placeholder="4桁のコード"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            error={codeError}
            inputMode="numeric"
          />

          <div className={styles.actions}>
            <Button
              variant="secondary"
              onClick={handleJoin}
              disabled={state.ui.isLoading || !state.connection.isConnected}
              size="lg"
            >
              ルームに参加
            </Button>
          </div>
        </div>

        {!state.connection.isConnected && (
          <p className={styles.connectionStatus}>サーバーに接続中...</p>
        )}
      </div>
    </div>
  );
}
