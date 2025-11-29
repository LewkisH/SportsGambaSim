import { createElement, clearElement } from '../utils/dom.js';
import { sleep } from '../utils/animations.js';

export async function renderActionNarrative(container, actions, onComplete) {
  clearElement(container);

  // Safety check: ensure actions is valid
  if (!actions || !Array.isArray(actions) || actions.length === 0) {
    console.error('Invalid actions provided to renderActionNarrative:', actions);
    if (onComplete) {
      onComplete();
    }
    return;
  }

  let isSkipped = false;

  const wrapper = createElement('div', 'max-w-4xl mx-auto p-8 min-h-screen flex flex-col items-center justify-center');

  // Skip button
  const skipBtn = createElement('button', 'fixed top-8 right-8 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-3 px-6 rounded-lg transition-colors z-10');
  skipBtn.textContent = 'Skip →';
  skipBtn.addEventListener('click', () => {
    isSkipped = true;
  });
  wrapper.appendChild(skipBtn);

  // Actions container
  const actionsContainer = createElement('div', 'bg-white/10 backdrop-blur rounded-xl p-8 shadow-xl w-full');
  const actionsTitle = createElement('h2', 'text-3xl font-bold text-white text-center mb-4');
  actionsTitle.textContent = '⚽ Match Highlights';
  actionsContainer.appendChild(actionsTitle);

  // Score display (will be updated with each action)
  const scoreDisplay = createElement('div', 'text-center mb-6 text-2xl font-bold text-yellow-400');
  scoreDisplay.textContent = '0 - 0';
  actionsContainer.appendChild(scoreDisplay);

  const actionsList = createElement('div', 'space-y-4');
  actionsContainer.appendChild(actionsList);
  wrapper.appendChild(actionsContainer);

  container.appendChild(wrapper);

  // Animate actions one by one
  for (let i = 0; i < actions.length; i++) {
    if (isSkipped) break;

    const action = actions[i];
    const actionText = typeof action === 'string' ? action : action.text;
    const isSuspenseful = typeof action === 'object' && action.suspense === true;
    const score = typeof action === 'object' && action.score ? action.score : { team1: 0, team2: 0 };

    // Update score display
    scoreDisplay.textContent = `${score.team1} - ${score.team2}`;

    const actionElement = createElement('div', 'bg-white/5 rounded-lg p-4 text-white text-lg fade-in');
    actionElement.textContent = actionText;

    // Add visual indicator for suspenseful moments
    if (isSuspenseful) {
      actionElement.classList.add('ring-2', 'ring-yellow-400', 'bg-white/10');
    }

    actionsList.appendChild(actionElement);

    // Scroll to bottom
    actionElement.scrollIntoView({ behavior: 'smooth', block: 'end' });

    // Wait before showing next action (unless it's the last one)
    if (i < actions.length - 1) {
      // Longer delay for suspenseful moments
      const delay = isSuspenseful ? 2500 : 1200;
      await sleep(delay);
    }
  }

  // If skipped, show all remaining actions immediately
  if (isSkipped && actionsList.children.length < actions.length) {
    clearElement(actionsList);
    actions.forEach(action => {
      const actionText = typeof action === 'string' ? action : action.text;
      const isSuspenseful = typeof action === 'object' && action.suspense === true;

      const actionElement = createElement('div', 'bg-white/5 rounded-lg p-4 text-white text-lg');
      actionElement.textContent = actionText;

      if (isSuspenseful) {
        actionElement.classList.add('ring-2', 'ring-yellow-400', 'bg-white/10');
      }

      actionsList.appendChild(actionElement);
    });

    // Update score to final score
    if (actions.length > 0) {
      const lastAction = actions[actions.length - 1];
      const finalScore = typeof lastAction === 'object' && lastAction.score ? lastAction.score : { team1: 0, team2: 0 };
      scoreDisplay.textContent = `${finalScore.team1} - ${finalScore.team2}`;
    }
  }

  // Wait a bit before proceeding
  await sleep(1500);

  // Call completion callback
  if (onComplete) {
    onComplete();
  }
}
