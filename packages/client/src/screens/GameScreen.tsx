import { useState } from 'react';
import { Button } from '../components/common/Button';
import { Card } from '../components/Card';
import { LivesDisplay } from '../components/LivesDisplay';
import { Chat } from '../components/Chat';
import { useGame } from '../context/GameContext';
import { useGameActions } from '../hooks/useGameActions';
import styles from './GameScreen.module.css';

export function GameScreen() {
  const { state } = useGame();
  const { placeCard, startPlacement, nextRound, playAgain, leaveRoom } = useGameActions();
  const [chatCollapsed, setChatCollapsed] = useState(true);

  const { game, room } = state;
  const round = game.round;

  const remainingNames = round?.remainingPlayers
    .map((id) => room.players.find((p) => p.id === id)?.name)
    .filter(Boolean) ?? [];

  return (
    <div className={styles.container}>
      {/* Top bar: lives + round info */}
      <div className={styles.topBar}>
        <LivesDisplay lives={game.lives} maxLives={game.maxLives} />
        <span className={styles.roundInfo}>
          ラウンド {game.currentRound} / {game.totalRounds}
        </span>
      </div>

      {/* Main content area */}
      <div className={styles.main}>
        {/* Theme Announcement / Discussion */}
        {(game.phase === 'THEME_ANNOUNCEMENT' || game.phase === 'DISCUSSION') && (
          <div className={styles.phase}>
            <p className={styles.phaseLabel}>
              {game.phase === 'THEME_ANNOUNCEMENT' ? 'テーマ発表' : '相談タイム'}
            </p>
            <h2 className={styles.theme}>{round?.theme}</h2>

            {game.myCard !== null && (
              <div className={styles.myCard}>
                <p className={styles.myCardLabel}>あなたのカード</p>
                <Card number={game.myCard} size="lg" highlight />
              </div>
            )}

            <p className={styles.hint}>
              {game.phase === 'THEME_ANNOUNCEMENT'
                ? 'テーマに沿って、自分の数字のイメージを話し合いましょう'
                : '数字を言わずに、ヒントを出し合いましょう！'}
            </p>

            <Button onClick={startPlacement} size="lg">
              配置を開始する
            </Button>
          </div>
        )}

        {/* Placement */}
        {game.phase === 'PLACEMENT' && (
          <div className={styles.phase}>
            <p className={styles.phaseLabel}>カード配置中</p>
            <h2 className={styles.theme}>{round?.theme}</h2>

            {/* Placed cards */}
            {round && round.placedCards.length > 0 && (
              <div className={styles.placedCards}>
                {round.placedCards.map((card) => (
                  <Card
                    key={card.playerId}
                    number={card.cardNumber}
                    playerName={card.playerName}
                    size="sm"
                  />
                ))}
              </div>
            )}

            {/* My card + place button */}
            {game.myCard !== null && !game.hasPlacedCard && (
              <div className={styles.myCard}>
                <p className={styles.myCardLabel}>あなたのカード</p>
                <Card number={game.myCard} size="lg" highlight />
                <Button onClick={placeCard} size="lg">
                  カードを出す
                </Button>
              </div>
            )}

            {game.hasPlacedCard && (
              <p className={styles.waiting}>他のプレイヤーを待っています...</p>
            )}

            {/* Remaining players */}
            {remainingNames.length > 0 && (
              <div className={styles.remaining}>
                <span className={styles.remainingLabel}>まだ出していない:</span>
                <span>{remainingNames.join('、')}</span>
              </div>
            )}
          </div>
        )}

        {/* Round Result */}
        {game.phase === 'ROUND_RESULT' && (
          <div className={styles.phase}>
            <p className={styles.phaseLabel}>結果発表</p>
            <h2 className={styles.theme}>{round?.theme}</h2>

            <div
              className={[styles.resultBanner, game.isSuccess ? styles.success : styles.failure]
                .filter(Boolean)
                .join(' ')}
            >
              {game.isSuccess ? '成功！' : '失敗...'}
            </div>

            {/* All placed cards */}
            {round && (
              <div className={styles.placedCards}>
                {round.placedCards.map((card) => (
                  <Card
                    key={card.playerId}
                    number={card.cardNumber}
                    playerName={card.playerName}
                    size="md"
                  />
                ))}
              </div>
            )}

            <Button onClick={nextRound} size="lg">
              次のラウンドへ
            </Button>
          </div>
        )}

        {/* Game Over */}
        {game.phase === 'GAME_OVER' && (
          <div className={styles.phase}>
            <div
              className={[
                styles.gameOverBanner,
                game.gameResult?.won ? styles.victory : styles.defeat,
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <h2>{game.gameResult?.won ? '勝利！' : 'ゲームオーバー'}</h2>
              <p>
                {game.gameResult?.won
                  ? '全ラウンドクリアしました！'
                  : `ラウンド ${game.gameResult?.finalRound} で終了`}
              </p>
            </div>

            {/* Final round cards */}
            {round && (
              <div className={styles.placedCards}>
                {round.placedCards.map((card) => (
                  <Card
                    key={card.playerId}
                    number={card.cardNumber}
                    playerName={card.playerName}
                    size="md"
                  />
                ))}
              </div>
            )}

            <div className={styles.gameOverActions}>
              <Button onClick={playAgain} size="lg">
                もう一度遊ぶ
              </Button>
              <Button variant="secondary" onClick={leaveRoom} size="md">
                ルームを退出
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Chat */}
      <div className={styles.chatArea}>
        <Chat collapsed={chatCollapsed} onToggle={() => setChatCollapsed((v) => !v)} />
      </div>
    </div>
  );
}
