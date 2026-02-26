import type { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | null;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.replace(/\s/g, '-').toLowerCase();

  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[styles.input, error ? styles.hasError : '', className]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
