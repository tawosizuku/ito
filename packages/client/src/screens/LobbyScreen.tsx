import { useState } from 'react';
import { MIN_LIVES, MAX_LIVES, MIN_ROUNDS, MAX_ROUNDS, MIN_PLAYERS } from '@ito/shared';
import { Button } from '../components/common/Button';
import { PlayerList } from '../components/PlayerList';
import { Chat } from '../components/Chat';
import { useGame } from '../context/GameContext';
import { useGameActions } from '../hooks/useGameActions';
import styles from './LobbyScreen.module.css';

export function LobbyScreen() {
  const { state } = useGame();
  const { leaveRoom, updateSettings, startGame } = useGameActions();
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const { room } = state;
  const isHost = room.myPlayerId === room.hostId;
  const canStart = room.players.filter((p) => p.isConnected).length >= MIN_PLAYERS;

  const handleCopyCode = async () => {
    if (!room.roomCode) return;
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>ロビー</h2>
            <button className={styles.roomCode} onClick={handleCopyCode} type="button">
              ルームコード: <strong>{room.roomCode}</strong>
              <span className={styles.copyHint}>
                {copied ? 'コピーしました！' : 'クリックでコピー'}
              </span>
            </button>
          </div>
          <Button variant="danger" size="sm" onClick={leaveRoom}>
            退出
          </Button>
        </div>

        <PlayerList players={room.players} myPlayerId={room.myPlayerId} />

        {/* Settings - Host only */}
        {isHost && (
          <div className={styles.settings}>
            <h3 className={styles.settingsTitle}>ゲーム設定</h3>

            <div className={styles.settingRow}>
              <label className={styles.settingLabel}>ライフ数</label>
              <div className={styles.settingControl}>
                {Array.from({ length: MAX_LIVES - MIN_LIVES + 1 }, (_, i) => i + MIN_LIVES).map(
                  (n) => (
                    <button
                      key={n}
                      className={[
                        styles.optionBtn,
                        room.settings.maxLives === n ? styles.optionActive : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => updateSettings({ maxLives: n })}
                      type="button"
                    >
                      {n}
                    </button>
                  ),
                )}
              </div>
            </div>

            <div className={styles.settingRow}>
              <label className={styles.settingLabel}>ラウンド数</label>
              <div className={styles.settingControl}>
                {Array.from({ length: MAX_ROUNDS - MIN_ROUNDS + 1 }, (_, i) => i + MIN_ROUNDS).map(
                  (n) => (
                    <button
                      key={n}
                      className={[
                        styles.optionBtn,
                        room.settings.totalRounds === n ? styles.optionActive : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => updateSettings({ totalRounds: n })}
                      type="button"
                    >
                      {n}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>
        )}

        {!isHost && (
          <div className={styles.settings}>
            <h3 className={styles.settingsTitle}>ゲーム設定</h3>
            <p className={styles.settingInfo}>
              ライフ: {room.settings.maxLives} / ラウンド: {room.settings.totalRounds}
            </p>
          </div>
        )}

        {isHost && (
          <Button size="lg" onClick={startGame} disabled={!canStart}>
            {canStart
              ? 'ゲーム開始'
              : `あと${MIN_PLAYERS - room.players.filter((p) => p.isConnected).length}人必要`}
          </Button>
        )}

        {!isHost && (
          <p className={styles.waitingText}>ホストがゲームを開始するのを待っています...</p>
        )}

        <Chat
          collapsed={chatCollapsed}
          onToggle={() => setChatCollapsed((v) => !v)}
        />
      </div>
    </div>
  );
}
