import { createElement, clearElement } from '../utils/dom.js';
import { sleep } from '../utils/animations.js';

export async function renderActionNarrative(container, actions, match, onComplete) {
  clearElement(container);

  // Safety check: ensure actions is valid
  if (!actions || !Array.isArray(actions) || actions.length === 0) {
    console.error('Invalid actions provided to renderActionNarrative:', actions);
    if (onComplete) {
      onComplete();
    }
    return;
  }

  const team1Name = match?.team1 || 'Team 1';
  const team2Name = match?.team2 || 'Team 2';

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
  const scoreDisplay = createElement('div', 'text-center mb-6 text-2xl font-bold text-yellow-400 transition-all duration-300');
  scoreDisplay.innerHTML = `<span>${team1Name}</span> <span class="text-white">0 - 0</span> <span>${team2Name}</span>`;
  actionsContainer.appendChild(scoreDisplay);

  const actionsList = createElement('div', 'space-y-4');
  actionsContainer.appendChild(actionsList);
  wrapper.appendChild(actionsContainer);

  container.appendChild(wrapper);

  // Animate actions one by one
  let previousScore = { team1: 0, team2: 0 };

  for (let i = 0; i < actions.length; i++) {
    if (isSkipped) break;

    const action = actions[i];
    const actionText = typeof action === 'string' ? action : action.text;
    const isSuspenseful = typeof action === 'object' && action.suspense === true;
    const score = typeof action === 'object' && action.score ? action.score : { team1: 0, team2: 0 };

    // Check if there's a goal (score changed)
    const isGoal = score.team1 !== previousScore.team1 || score.team2 !== previousScore.team2;

    // Update score display with team names
    scoreDisplay.innerHTML = `<span>${team1Name}</span> <span class="text-white">${score.team1} - ${score.team2}</span> <span>${team2Name}</span>`;

    // Add goal animation to score display
    if (isGoal) {
      scoreDisplay.classList.add('ring-4', 'ring-red-500', 'scale-110');
      setTimeout(() => {
        scoreDisplay.classList.remove('ring-4', 'ring-red-500', 'scale-110');
      }, 1500);
    }

    const actionElement = createElement('div', 'bg-white/5 rounded-lg p-4 text-white text-lg fade-in');
    actionElement.textContent = actionText;

    // Add visual indicators
    if (isGoal && isSuspenseful) {
      // Goal + Suspenseful = Maximum emphasis (red + yellow outline, brighter bg)
      actionElement.classList.add('ring-4', 'ring-red-500', 'ring-offset-2', 'ring-offset-yellow-400', 'bg-white/20', 'shadow-2xl');
    } else if (isGoal) {
      // Just a goal = Red outline
      actionElement.classList.add('ring-2', 'ring-red-500', 'bg-white/10');
    } else if (isSuspenseful) {
      // Just suspenseful = Yellow outline
      actionElement.classList.add('ring-2', 'ring-yellow-400', 'bg-white/10');
    }

    actionsList.appendChild(actionElement);

    // Scroll to bottom
    actionElement.scrollIntoView({ behavior: 'smooth', block: 'end' });

    // Wait before showing next action (unless it's the last one)
    if (i < actions.length - 1) {
      // Determine delay based on what happened
      let delay = 1200; // Base delay
      if (isGoal && isSuspenseful) {
        delay = 3500; // Goal + Suspense = Longest delay
      } else if (isGoal) {
        delay = 2500; // Goal = Long delay
      } else if (isSuspenseful) {
        delay = 2500; // Suspense = Long delay
      }
      await sleep(delay);
    }

    previousScore = score;
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
      scoreDisplay.innerHTML = `<span>${team1Name}</span> <span class="text-white">${finalScore.team1} - ${finalScore.team2}</span> <span>${team2Name}</span>`;
    }
  }

  // Wait a bit before proceeding
  await sleep(1500);

  // Call completion callback
  if (onComplete) {
    onComplete();
  }
}
