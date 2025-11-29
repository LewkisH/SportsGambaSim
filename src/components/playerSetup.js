import { gameState } from '../state/gameState.js';
import { createElement, clearElement } from '../utils/dom.js';

export function renderPlayerSetup(container) {
  clearElement(container);

  const wrapper = createElement('div', 'max-w-2xl mx-auto p-8');

  // Title
  const title = createElement('h1', 'text-5xl font-bold text-white text-center mb-4');
  title.textContent = '⚽ Football Gambling Sim';
  wrapper.appendChild(title);

  const subtitle = createElement('p', 'text-xl text-gray-300 text-center mb-12');
  subtitle.textContent = 'Add players to begin';
  wrapper.appendChild(subtitle);

  // Game settings card
  const settingsCard = createElement('div', 'bg-white/10 backdrop-blur rounded-xl p-6 mb-8 shadow-xl');

  const settingsTitle = createElement('h2', 'text-2xl font-semibold text-white mb-4');
  settingsTitle.textContent = 'Game Settings';
  settingsCard.appendChild(settingsTitle);

  // Round bonus input
  const bonusGroup = createElement('div');
  const bonusLabel = createElement('label', 'block text-white font-medium mb-2');
  bonusLabel.textContent = 'Round Bonus ($)';
  const bonusInput = createElement('input', 'w-full px-4 py-3 rounded-lg bg-white/90 text-gray-900 text-lg');
  bonusInput.setAttribute('type', 'number');
  bonusInput.setAttribute('id', 'round-bonus');
  bonusInput.setAttribute('placeholder', 'Bonus amount per round');
  bonusInput.setAttribute('min', '0');
  bonusInput.setAttribute('step', '0.01');
  bonusInput.setAttribute('value', '5');
  const bonusHelp = createElement('p', 'text-gray-400 text-sm mt-1');
  bonusHelp.textContent = 'Amount given to all players each round';
  bonusGroup.appendChild(bonusLabel);
  bonusGroup.appendChild(bonusInput);
  bonusGroup.appendChild(bonusHelp);
  settingsCard.appendChild(bonusGroup);

  wrapper.appendChild(settingsCard);

  // Player form card
  const formCard = createElement('div', 'bg-white/10 backdrop-blur rounded-xl p-6 mb-8 shadow-xl');

  const formTitle = createElement('h2', 'text-2xl font-semibold text-white mb-4');
  formTitle.textContent = 'Add Player';
  formCard.appendChild(formTitle);

  const form = createElement('form', 'space-y-4');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const name = formData.get('playerName');
    const balance = parseFloat(formData.get('startingBalance'));

    if (name && balance >= 0) {
      gameState.addPlayer(name, balance);
      // Only reset the name field, keep the balance value
      const nameInput = form.querySelector('input[name="playerName"]');
      if (nameInput) {
        nameInput.value = '';
        nameInput.focus();
      }
    }
  });

  // Name input
  const nameGroup = createElement('div');
  const nameLabel = createElement('label', 'block text-white font-medium mb-2');
  nameLabel.textContent = 'Player Name';
  const nameInput = createElement('input', 'w-full px-4 py-3 rounded-lg bg-white/90 text-gray-900 text-lg');
  nameInput.setAttribute('type', 'text');
  nameInput.setAttribute('name', 'playerName');
  nameInput.setAttribute('placeholder', 'Enter player name');
  nameInput.setAttribute('required', '');
  nameGroup.appendChild(nameLabel);
  nameGroup.appendChild(nameInput);
  form.appendChild(nameGroup);

  // Balance input
  const balanceGroup = createElement('div');
  const balanceLabel = createElement('label', 'block text-white font-medium mb-2');
  balanceLabel.textContent = 'Starting Balance ($)';
  const balanceInput = createElement('input', 'w-full px-4 py-3 rounded-lg bg-white/90 text-gray-900 text-lg');
  balanceInput.setAttribute('type', 'number');
  balanceInput.setAttribute('name', 'startingBalance');
  balanceInput.setAttribute('placeholder', 'Enter starting balance');
  balanceInput.setAttribute('min', '0');
  balanceInput.setAttribute('value', '100');
  balanceInput.setAttribute('required', '');
  balanceGroup.appendChild(balanceLabel);
  balanceGroup.appendChild(balanceInput);
  form.appendChild(balanceGroup);

  // Submit button
  const submitBtn = createElement('button', 'w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors');
  submitBtn.setAttribute('type', 'submit');
  submitBtn.textContent = 'Add Player';
  form.appendChild(submitBtn);

  formCard.appendChild(form);
  wrapper.appendChild(formCard);

  // Players list
  const playersCard = createElement('div', 'bg-white/10 backdrop-blur rounded-xl p-6 shadow-xl mb-8');
  const playersTitle = createElement('h2', 'text-2xl font-semibold text-white mb-4');
  playersTitle.textContent = 'Players';
  playersCard.appendChild(playersTitle);

  const playersList = createElement('div', 'space-y-3');
  playersList.id = 'players-list';
  playersCard.appendChild(playersList);

  wrapper.appendChild(playersCard);

  // Start game button
  const startBtn = createElement('button', 'w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-4 px-6 rounded-lg text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed');
  startBtn.id = 'start-game-btn';
  startBtn.textContent = 'Start Game';
  startBtn.addEventListener('click', () => {
    const state = gameState.getState();
    if (state.players.length > 0) {
      // Get and save the round bonus setting
      const bonusInput = document.getElementById('round-bonus');
      const roundBonus = bonusInput ? parseFloat(bonusInput.value) || 5 : 5;
      gameState.setState({ roundBonus });

      gameState.setPhase('BETTING');
      gameState.incrementRound();
    }
  });
  wrapper.appendChild(startBtn);

  container.appendChild(wrapper);

  // Subscribe to state changes
  const updatePlayersList = (state) => {
    const list = document.getElementById('players-list');
    const startBtn = document.getElementById('start-game-btn');

    if (!list) return;

    clearElement(list);

    if (state.players.length === 0) {
      const emptyMsg = createElement('p', 'text-gray-400 text-center py-4');
      emptyMsg.textContent = 'No players yet. Add players to start!';
      list.appendChild(emptyMsg);
      startBtn.disabled = true;
    } else {
      startBtn.disabled = false;
      state.players.forEach(player => {
        const playerItem = createElement('div', 'flex justify-between items-center bg-white/5 px-4 py-3 rounded-lg');

        const info = createElement('div', 'flex-1');
        const name = createElement('span', 'text-white font-semibold text-lg');
        name.textContent = player.name;
        const balance = createElement('span', 'text-gray-300 ml-4');
        balance.textContent = `$${player.balance}`;
        info.appendChild(name);
        info.appendChild(balance);

        const removeBtn = createElement('button', 'bg-red-500/80 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors');
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
          gameState.removePlayer(player.id);
        });

        playerItem.appendChild(info);
        playerItem.appendChild(removeBtn);
        list.appendChild(playerItem);
      });
    }
  };

  const unsubscribe = gameState.subscribe(updatePlayersList);
  updatePlayersList(gameState.getState());

  return unsubscribe;
}
