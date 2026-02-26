import type { Player } from '@ito/shared';
import styles from './PlayerList.module.css';

interface PlayerListProps {
  players: Player[];
  myPlayerId: string | null;
}

export function PlayerList({ players, myPlayerId }: PlayerListProps) {
  return (
    <div className={styles.list}>
      <h3 className={styles.heading}>
        プレイヤー <span className={styles.count}>{players.length}</span>
      </h3>
      <ul className={styles.players}>
        {players.map((player) => (
          <li
            key={player.id}
            className={[
              styles.player,
              !player.isConnected ? styles.disconnected : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className={styles.name}>
              {player.name}
              {player.id === myPlayerId && (
                <span className={styles.youBadge}>あなた</span>
              )}
            </span>
            <span className={styles.badges}>
              {player.isHost && <span className={styles.hostBadge}>ホスト</span>}
              {!player.isConnected && (
                <span className={styles.offlineBadge}>切断中</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
