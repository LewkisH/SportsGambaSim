class GameState {
  constructor() {
    this.state = {
      phase: 'SETUP', // 'SETUP' | 'BETTING' | 'GENERATING' | 'NARRATIVE' | 'RESULTS'
      players: [],
      roundBonus: 5, // Amount given to all players each round
      currentMatch: {
        team1: '',
        team2: '',
        odds: {
          team1Win: 0,
          draw: 0,
          team2Win: 0
        },
        actions: [],
        result: null // 'TEAM1' | 'DRAW' | 'TEAM2'
      },
      nextMatch: null, // Pre-generated next match for faster UX
      roundNumber: 0
    };
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  updatePlayer(playerId, updates) {
    const players = this.state.players.map(player =>
      player.id === playerId ? { ...player, ...updates } : player
    );
    this.setState({ players });
  }

  updateMatch(updates) {
    const currentMatch = { ...this.state.currentMatch, ...updates };
    this.setState({ currentMatch });
  }

  setNextMatch(match) {
    this.setState({ nextMatch: match });
  }

  resetBets() {
    const players = this.state.players.map(player => ({
      ...player,
      currentBet: 0,
      betChoice: 'SKIP'
    }));
    this.setState({ players });
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // Helper methods
  addPlayer(name, startingBalance) {
    const player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name,
      balance: startingBalance,
      currentBet: 0,
      betChoice: 'SKIP'
    };
    const players = [...this.state.players, player];
    this.setState({ players });
    return player;
  }

  removePlayer(playerId) {
    const players = this.state.players.filter(p => p.id !== playerId);
    this.setState({ players });
  }

  setPhase(phase) {
    this.setState({ phase });
  }

  incrementRound() {
    this.setState({ roundNumber: this.state.roundNumber + 1 });
  }
}

// Export singleton instance
export const gameState = new GameState();
