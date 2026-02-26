import styles from './LivesDisplay.module.css';

interface LivesDisplayProps {
  lives: number;
  maxLives: number;
}

export function LivesDisplay({ lives, maxLives }: LivesDisplayProps) {
  return (
    <div className={styles.container}>
      {Array.from({ length: maxLives }, (_, i) => (
        <span
          key={i}
          className={[styles.heart, i < lives ? styles.active : styles.empty]
            .filter(Boolean)
            .join(' ')}
          aria-label={i < lives ? 'ライフ残り' : 'ライフ消費'}
        >
          ♥
        </span>
      ))}
    </div>
  );
}
