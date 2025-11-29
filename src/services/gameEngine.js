/**
 * Game Engine - Core game logic for betting, RNG, and payouts
 */

/**
 * Validates that all player bets are valid
 * @param {Array} players - Array of player objects
 * @returns {Object} { valid: boolean, errors: Array }
 */
export function validateBets(players) {
  const errors = [];

  players.forEach(player => {
    if (player.currentBet < 0) {
      errors.push(`${player.name}: Bet cannot be negative`);
    }
    if (player.currentBet > player.balance) {
      errors.push(`${player.name}: Insufficient balance`);
    }
    if (player.currentBet > 0 && player.betChoice === 'SKIP') {
      errors.push(`${player.name}: Must select a bet choice`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculate match winner using RNG based on odds
 * @param {Object} odds - { team1Win, draw, team2Win }
 * @returns {string} 'TEAM1' | 'DRAW' | 'TEAM2'
 */
export function calculateWinner(odds) {
  const rand = Math.random();

  if (rand < odds.team1Win) {
    return 'TEAM1';
  }
  if (rand < odds.team1Win + odds.draw) {
    return 'DRAW';
  }
  return 'TEAM2';
}

/**
 * Convert probability to payout multiplier
 * @param {number} probability - Probability value (0-1)
 * @returns {number} Multiplier
 */
export function oddsToMultiplier(probability) {
  if (probability === 0) return 0;
  return 1 / probability;
}

/**
 * Calculate payout for a single bet
 * @param {number} betAmount - Amount bet
 * @param {string} betChoice - 'TEAM1' | 'DRAW' | 'TEAM2' | 'SKIP'
 * @param {string} result - 'TEAM1' | 'DRAW' | 'TEAM2'
 * @param {Object} odds - { team1Win, draw, team2Win }
 * @returns {number} Net winnings (positive) or loss (negative)
 */
export function calculatePayout(betAmount, betChoice, result, odds) {
  // Skip or zero bet
  if (betChoice === 'SKIP' || betAmount === 0) {
    return 0;
  }

  // Lost bet
  if (betChoice !== result) {
    return -betAmount;
  }

  // Won bet - calculate winnings
  let probability;
  if (result === 'TEAM1') {
    probability = odds.team1Win;
  } else if (result === 'DRAW') {
    probability = odds.draw;
  } else {
    probability = odds.team2Win;
  }

  const multiplier = oddsToMultiplier(probability);
  const totalReturn = betAmount * multiplier;
  const netWinnings = totalReturn - betAmount;

  return netWinnings;
}

/**
 * Calculate payouts for all players
 * @param {Array} players - Array of player objects
 * @param {string} result - Match result
 * @param {Object} odds - Match odds
 * @returns {Array} Array of { playerId, payout, newBalance }
 */
export function calculatePayouts(players, result, odds) {
  return players.map(player => {
    const payout = calculatePayout(
      player.currentBet,
      player.betChoice,
      result,
      odds
    );
    const newBalance = player.balance + payout;

    return {
      playerId: player.id,
      playerName: player.name,
      bet: player.currentBet,
      betChoice: player.betChoice,
      payout,
      newBalance
    };
  });
}

/**
 * Add round money to all players ($5 per round)
 * @param {Array} players - Array of player objects
 * @param {number} amount - Amount to add (default: 5)
 * @returns {Array} Updated players with new balances
 */
export function addRoundMoney(players, amount = 5) {
  return players.map(player => ({
    ...player,
    balance: player.balance + amount
  }));
}

/**
 * Apply payouts to players and add round money
 * @param {Array} players - Array of player objects
 * @param {Array} payoutResults - Array from calculatePayouts
 * @param {number} roundBonus - Amount to add per round (default: 5)
 * @returns {Array} Updated players
 */
export function applyPayoutsAndRoundMoney(players, payoutResults, roundBonus = 5) {
  // First apply payouts
  let updatedPlayers = players.map(player => {
    const payoutResult = payoutResults.find(p => p.playerId === player.id);
    return {
      ...player,
      balance: payoutResult.newBalance
    };
  });

  // Then add round money
  updatedPlayers = addRoundMoney(updatedPlayers, roundBonus);

  return updatedPlayers;
}
