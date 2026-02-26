import { useEffect } from 'react';
import { socket } from '../socket/client';
import { registerServerEvents, unregisterServerEvents } from '../socket/events';
import { useGame } from '../context/GameContext';

export function useSocket() {
  const { dispatch } = useGame();

  useEffect(() => {
    // Register events before connecting
    registerServerEvents(socket, dispatch);

    socket.on('connect', () => {
      dispatch({ type: 'SOCKET_CONNECTED' });

      // Attempt reconnection if we were in a room
      const roomCode = sessionStorage.getItem('ito:roomCode');
      const myName = sessionStorage.getItem('ito:myName');
      if (roomCode && myName) {
        socket.emit('room:join', roomCode, myName, (response) => {
          if (response.success && response.playerId) {
            dispatch({
              type: 'ROOM_JOINED',
              roomCode,
              myPlayerId: response.playerId,
              myName,
            });
          } else {
            // Reconnection failed, clear session
            sessionStorage.removeItem('ito:roomCode');
            sessionStorage.removeItem('ito:myName');
          }
        });
      }
    });

    socket.on('disconnect', () => {
      dispatch({ type: 'SOCKET_DISCONNECTED' });
    });

    // Connect
    socket.connect();

    return () => {
      unregisterServerEvents(socket);
      socket.off('connect');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, [dispatch]);
}
