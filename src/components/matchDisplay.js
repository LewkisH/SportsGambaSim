import { createElement } from '../utils/dom.js';
import { oddsToMultiplier } from '../services/gameEngine.js';

export function renderMatchDisplay(match) {
  const container = createElement('div', 'bg-white/10 backdrop-blur rounded-xl p-8 mb-8 shadow-xl');

  // Match title
  const title = createElement('div', 'text-center mb-6');
  const vs = createElement('div', 'text-6xl font-bold text-white mb-2');
  vs.textContent = `${match.team1} vs ${match.team2}`;
  title.appendChild(vs);

  container.appendChild(title);

  // Odds display
  const oddsContainer = createElement('div', 'grid grid-cols-3 gap-4');

  // Team 1 Win
  const team1Card = createOddsCard(
    match.team1,
    match.odds.team1Win,
    'bg-blue-600/80'
  );
  oddsContainer.appendChild(team1Card);

  // Draw
  const drawCard = createOddsCard(
    'Draw',
    match.odds.draw,
    'bg-gray-600/80'
  );
  oddsContainer.appendChild(drawCard);

  // Team 2 Win
  const team2Card = createOddsCard(
    match.team2,
    match.odds.team2Win,
    'bg-red-600/80'
  );
  oddsContainer.appendChild(team2Card);

  container.appendChild(oddsContainer);

  return container;
}

function createOddsCard(label, probability, bgColor) {
  const card = createElement('div', `${bgColor} rounded-lg p-4 text-center`);

  const labelEl = createElement('div', 'text-white font-semibold text-lg mb-2');
  labelEl.textContent = label;
  card.appendChild(labelEl);

  const multiplier = oddsToMultiplier(probability);
  const multiplierEl = createElement('div', 'text-white text-3xl font-bold mb-1');
  multiplierEl.textContent = `${multiplier.toFixed(2)}x`;
  card.appendChild(multiplierEl);

  const probEl = createElement('div', 'text-white/80 text-sm');
  probEl.textContent = `${(probability * 100).toFixed(0)}% chance`;
  card.appendChild(probEl);

  return card;
}
