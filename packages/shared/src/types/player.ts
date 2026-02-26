export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isConnected: boolean;
}

export interface PlayerWithCard extends Player {
  cardNumber: number;
  hasPlaced: boolean;
}
