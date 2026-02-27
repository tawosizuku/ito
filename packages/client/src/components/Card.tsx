import styles from './Card.module.css';

interface CardProps {
  number: number;
  playerName?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  revealed?: boolean;
  highlight?: boolean;
}

export function Card({
  number,
  playerName,
  label,
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
          {label && <span className={styles.label}>{label}</span>}
        </>
      ) : (
        <>
          <span className={styles.back}>?</span>
          {playerName && <span className={styles.name}>{playerName}</span>}
          {label && <span className={styles.label}>{label}</span>}
        </>
      )}
    </div>
  );
}
