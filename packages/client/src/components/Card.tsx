import styles from './Card.module.css';

interface CardProps {
  number: number;
  playerName?: string;
  size?: 'sm' | 'md' | 'lg';
  revealed?: boolean;
  highlight?: boolean;
}

export function Card({
  number,
  playerName,
  size = 'md',
  revealed = true,
  highlight = false,
}: CardProps) {
  return (
    <div
      className={[
        styles.card,
        styles[size],
        highlight ? styles.highlight : '',
        !revealed ? styles.hidden : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {revealed ? (
        <>
          <span className={styles.number}>{number}</span>
          {playerName && <span className={styles.name}>{playerName}</span>}
        </>
      ) : (
        <span className={styles.back}>?</span>
      )}
    </div>
  );
}
