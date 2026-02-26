import { useState, useRef, useEffect, type FormEvent } from 'react';
import { validateChatMessage, CHAT_MESSAGE_MAX_LENGTH } from '@ito/shared';
import { useGame } from '../context/GameContext';
import { useGameActions } from '../hooks/useGameActions';
import styles from './Chat.module.css';

interface ChatProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Chat({ collapsed = false, onToggle }: ChatProps) {
  const { state, dispatch } = useGame();
  const { sendMessage } = useGameActions();
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, unreadCount } = state.chat;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!collapsed) {
      dispatch({ type: 'CHAT_READ' });
    }
  }, [collapsed, messages.length, dispatch]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    const err = validateChatMessage(trimmed);
    if (err) return;
    sendMessage(trimmed);
    setText('');
  };

  return (
    <div className={[styles.chat, collapsed ? styles.collapsed : ''].filter(Boolean).join(' ')}>
      <button className={styles.header} onClick={onToggle} type="button">
        <span>チャット</span>
        {collapsed && unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount}</span>
        )}
      </button>

      {!collapsed && (
        <>
          <div className={styles.messages}>
            {messages.length === 0 && (
              <p className={styles.empty}>メッセージはまだありません</p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={[styles.message, msg.isSystem ? styles.system : '']
                  .filter(Boolean)
                  .join(' ')}
              >
                {!msg.isSystem && (
                  <span className={styles.sender}>{msg.playerName}</span>
                )}
                <span className={styles.text}>{msg.text}</span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className={styles.inputArea} onSubmit={handleSubmit}>
            <input
              className={styles.input}
              type="text"
              placeholder="メッセージを入力..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={CHAT_MESSAGE_MAX_LENGTH}
            />
            <button className={styles.sendBtn} type="submit" disabled={!text.trim()}>
              送信
            </button>
          </form>
        </>
      )}
    </div>
  );
}
