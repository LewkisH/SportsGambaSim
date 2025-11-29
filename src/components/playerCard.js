import { createElement } from '../utils/dom.js';
import { gameState } from '../state/gameState.js';

export function renderPlayerCard(player, match) {
  const card = createElement('div', 'bg-white/10 backdrop-blur rounded-lg p-4 flex-shrink-0 w-64');
  card.setAttribute('data-player-id', player.id);

  // Player name and balance
  const header = createElement('div', 'mb-4');
  const name = createElement('div', 'text-white font-bold text-xl mb-1');
  name.textContent = player.name;
  const balance = createElement('div', 'text-gray-300 text-lg');
  balance.textContent = `Balance: $${player.balance.toFixed(2)}`;
  header.appendChild(name);
  header.appendChild(balance);
  card.appendChild(header);

  // Bet amount input group
  const betGroup = createElement('div', 'mb-3');
  const betLabelRow = createElement('div', 'flex justify-between items-center mb-2');
  const betLabel = createElement('label', 'text-white text-sm font-medium');
  betLabel.textContent = 'Bet Amount:';
  betLabelRow.appendChild(betLabel);

  // Button group for All-in, +10, -10
  const btnGroup = createElement('div', 'flex gap-1');

  // -10 button
  const minus10Btn = createElement('button', 'text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold px-2 py-1 rounded transition-colors');
  minus10Btn.textContent = '-10';
  minus10Btn.setAttribute('type', 'button');
  minus10Btn.addEventListener('click', () => {
    // Read current value from the input field, not state
    const input = card.querySelector(`input[data-player-id="${player.id}"]`);
    const currentValue = input ? parseFloat(input.value) || 0 : player.currentBet || 0;
    const newBet = Math.max(0, Math.round((currentValue - 10) * 100) / 100);

    gameState.updatePlayer(player.id, { currentBet: newBet });

    // Update the input value
    if (input) {
      input.value = newBet.toString();
    }
  });
  btnGroup.appendChild(minus10Btn);

  // +10 button
  const plus10Btn = createElement('button', 'text-xs bg-green-600 hover:bg-green-700 text-white font-semibold px-2 py-1 rounded transition-colors');
  plus10Btn.textContent = '+10';
  plus10Btn.setAttribute('type', 'button');
  plus10Btn.addEventListener('click', () => {
    // Read current value from the input field, not state
    const input = card.querySelector(`input[data-player-id="${player.id}"]`);
    const currentValue = input ? parseFloat(input.value) || 0 : player.currentBet || 0;
    const newBet = Math.min(player.balance, Math.round((currentValue + 10) * 100) / 100);

    gameState.updatePlayer(player.id, { currentBet: newBet });

    // Update the input value
    if (input) {
      input.value = newBet.toString();
    }
  });
  btnGroup.appendChild(plus10Btn);

  // All-in button
  const allInBtn = createElement('button', 'text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold px-2 py-1 rounded transition-colors');
  allInBtn.textContent = 'All In';
  allInBtn.setAttribute('type', 'button');
  allInBtn.addEventListener('click', () => {
    const roundedBalance = Math.floor(player.balance * 100) / 100;
    gameState.updatePlayer(player.id, { currentBet: roundedBalance });

    // Update the input value
    const input = card.querySelector(`input[data-player-id="${player.id}"]`);
    if (input) {
      input.value = roundedBalance.toFixed(2);
    }
  });
  btnGroup.appendChild(allInBtn);

  betLabelRow.appendChild(btnGroup);
  betGroup.appendChild(betLabelRow);

  // Bet input with validation
  const betInputWrapper = createElement('div', 'relative');
  const betInput = createElement('input', 'w-full px-3 py-2 rounded bg-white/90 text-gray-900 font-semibold');
  betInput.setAttribute('type', 'number');
  betInput.setAttribute('min', '0');
  betInput.setAttribute('step', '0.01');
  betInput.setAttribute('max', player.balance.toFixed(2));

  // Only show formatted value if it's not zero or if player has actually set a bet
  const initialValue = player.currentBet || 0;
  betInput.setAttribute('value', initialValue === 0 ? '0' : initialValue.toString());
  betInput.setAttribute('data-player-id', player.id);

  betInput.addEventListener('input', (e) => {
    const rawAmount = parseFloat(e.target.value) || 0;
    const roundedAmount = Math.round(rawAmount * 100) / 100; // Round to nearest cent

    // Show validation immediately
    const validationMsg = card.querySelector('.validation-message');
    if (roundedAmount > player.balance) {
      if (validationMsg) {
        validationMsg.classList.remove('hidden');
      }
      betInput.classList.add('ring-2', 'ring-red-500');
    } else {
      if (validationMsg) {
        validationMsg.classList.add('hidden');
      }
      betInput.classList.remove('ring-2', 'ring-red-500');
    }

    // Update state immediately without formatting
    gameState.updatePlayer(player.id, { currentBet: roundedAmount });
  });

  // Format and finalize on blur
  betInput.addEventListener('blur', (e) => {
    const rawAmount = parseFloat(e.target.value) || 0;
    const roundedAmount = Math.round(rawAmount * 100) / 100;
    e.target.value = roundedAmount.toFixed(2);
    gameState.updatePlayer(player.id, { currentBet: roundedAmount });
  });

  betInputWrapper.appendChild(betInput);
  betGroup.appendChild(betInputWrapper);

  // Validation message
  const validationMsg = createElement('div', 'validation-message text-red-400 text-xs mt-1 font-semibold hidden');
  validationMsg.textContent = '⚠️ Insufficient funds';
  if (player.currentBet > player.balance) {
    validationMsg.classList.remove('hidden');
    betInput.classList.add('ring-2', 'ring-red-500');
  }
  betGroup.appendChild(validationMsg);

  card.appendChild(betGroup);

  // Bet choice buttons
  const choiceGroup = createElement('div', 'space-y-2');
  const choiceLabel = createElement('div', 'text-white text-sm font-medium mb-2');
  choiceLabel.textContent = 'Bet On:';
  choiceGroup.appendChild(choiceLabel);

  const choices = [
    { value: 'TEAM1', label: match.team1, color: 'bg-blue-600 hover:bg-blue-700' },
    { value: 'DRAW', label: 'Draw', color: 'bg-gray-600 hover:bg-gray-700' },
    { value: 'TEAM2', label: match.team2, color: 'bg-red-600 hover:bg-red-700' },
    { value: 'SKIP', label: 'Skip', color: 'bg-yellow-600 hover:bg-yellow-700' }
  ];

  choices.forEach(choice => {
    const btn = createElement('button', `w-full ${choice.color} text-white font-semibold py-2 px-4 rounded transition-colors text-sm`);
    btn.textContent = choice.label;
    btn.setAttribute('type', 'button');
    btn.setAttribute('data-choice', choice.value);

    if (player.betChoice === choice.value) {
      btn.classList.add('ring-4', 'ring-white');
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      gameState.updatePlayer(player.id, { betChoice: choice.value });
    });

    choiceGroup.appendChild(btn);
  });

  card.appendChild(choiceGroup);

  // Current bet display (with class for easy updating)
  if (player.currentBet > 0 && player.betChoice !== 'SKIP') {
    const currentBet = createElement('div', 'current-bet-display mt-4 text-center bg-green-600/30 rounded p-2');
    const betText = createElement('div', 'text-white font-semibold text-sm');
    betText.textContent = `Betting $${player.currentBet.toFixed(2)} on ${getChoiceLabel(player.betChoice, match)}`;
    currentBet.appendChild(betText);
    card.appendChild(currentBet);
  }

  return card;
}

function getChoiceLabel(choice, match) {
  if (choice === 'TEAM1') return match.team1;
  if (choice === 'TEAM2') return match.team2;
  if (choice === 'DRAW') return 'Draw';
  return 'Skip';
}
