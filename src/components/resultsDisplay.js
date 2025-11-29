import { createElement, clearElement } from '../utils/dom.js';
import { gameState } from '../state/gameState.js';

export function renderResultsDisplay(container, payoutResults, match) {
  clearElement(container);

  const wrapper = createElement('div', 'max-w-6xl mx-auto p-8');

  // Result header
  const resultHeader = createElement('div', 'text-center mb-8');
  const title = createElement('h1', 'text-5xl font-bold text-white mb-4');

  const resultText = getResultText(match.result, match);
  title.textContent = `🏆 ${resultText}`;
  resultHeader.appendChild(title);
  wrapper.appendChild(resultHeader);

  // Results table
  const tableCard = createElement('div', 'bg-white/10 backdrop-blur rounded-xl p-6 mb-8 shadow-xl overflow-x-auto');
  const table = createElement('table', 'w-full text-white');

  // Table header
  const thead = createElement('thead');
  const headerRow = createElement('tr', 'border-b border-white/20');
  ['Player', 'Bet', 'Choice', 'Result', 'Payout', 'New Balance'].forEach(text => {
    const th = createElement('th', 'py-3 px-4 text-left font-semibold');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Table body
  const tbody = createElement('tbody');
  payoutResults.forEach((result, index) => {
    const row = createElement('tr', `${index % 2 === 0 ? 'bg-white/5' : ''} border-b border-white/10`);

    // Player name
    const nameCell = createElement('td', 'py-3 px-4 font-semibold');
    nameCell.textContent = result.playerName;
    row.appendChild(nameCell);

    // Bet amount
    const betCell = createElement('td', 'py-3 px-4');
    betCell.textContent = `$${result.bet.toFixed(2)}`;
    row.appendChild(betCell);

    // Bet choice
    const choiceCell = createElement('td', 'py-3 px-4');
    choiceCell.textContent = getChoiceLabel(result.betChoice, match);
    row.appendChild(choiceCell);

    // Result (Won/Lost/Skip)
    const resultCell = createElement('td', 'py-3 px-4 font-semibold');
    const resultLabel = getResultLabel(result.betChoice, result.payout);
    resultCell.textContent = resultLabel;
    if (result.payout > 0) {
      resultCell.classList.add('text-green-400');
    } else if (result.payout < 0) {
      resultCell.classList.add('text-red-400');
    } else {
      resultCell.classList.add('text-gray-400');
    }
    row.appendChild(resultCell);

    // Payout
    const payoutCell = createElement('td', 'py-3 px-4 font-bold text-lg');
    if (result.payout > 0) {
      payoutCell.textContent = `+$${result.payout.toFixed(2)}`;
      payoutCell.classList.add('text-green-400');
    } else if (result.payout < 0) {
      payoutCell.textContent = `-$${Math.abs(result.payout).toFixed(2)}`;
      payoutCell.classList.add('text-red-400');
    } else {
      payoutCell.textContent = '$0';
      payoutCell.classList.add('text-gray-400');
    }
    row.appendChild(payoutCell);

    // New balance (includes +$5 round bonus)
    const balanceCell = createElement('td', 'py-3 px-4 font-bold text-lg text-yellow-400');
    balanceCell.textContent = `$${result.newBalance.toFixed(2)}`;
    row.appendChild(balanceCell);

    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  tableCard.appendChild(table);
  wrapper.appendChild(tableCard);

  // Round bonus notice
  const state = gameState.getState();
  const bonusNotice = createElement('div', 'text-center mb-8 bg-green-600/30 backdrop-blur rounded-lg p-4');
  const bonusText = createElement('p', 'text-white text-lg');
  bonusText.textContent = `💰 All players received +$${state.roundBonus.toFixed(2)} round bonus!`;
  bonusNotice.appendChild(bonusText);
  wrapper.appendChild(bonusNotice);

  // Next round button
  const nextBtn = createElement('button', 'w-full max-w-md mx-auto block bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors');
  nextBtn.textContent = 'Next Round →';
  nextBtn.addEventListener('click', () => {
    gameState.resetBets();
    gameState.setPhase('BETTING');
    gameState.incrementRound();
  });
  wrapper.appendChild(nextBtn);

  container.appendChild(wrapper);
}

function getResultText(result, match) {
  if (result === 'TEAM1') {
    return `${match.team1} Wins!`;
  } else if (result === 'TEAM2') {
    return `${match.team2} Wins!`;
  } else {
    return 'Draw!';
  }
}

function getChoiceLabel(choice, match) {
  if (choice === 'TEAM1') return match.team1;
  if (choice === 'TEAM2') return match.team2;
  if (choice === 'DRAW') return 'Draw';
  return 'Skip';
}

function getResultLabel(betChoice, payout) {
  if (betChoice === 'SKIP' || payout === 0) {
    return 'Skipped';
  }
  return payout > 0 ? '✓ Won' : '✗ Lost';
}
