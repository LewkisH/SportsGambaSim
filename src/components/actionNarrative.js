import { createElement, clearElement } from '../utils/dom.js';
import { sleep } from '../utils/animations.js';

export async function renderActionNarrative(container, actions, onComplete) {
  clearElement(container);

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
  const actionsTitle = createElement('h2', 'text-3xl font-bold text-white text-center mb-8');
  actionsTitle.textContent = '⚽ Match Highlights';
  actionsContainer.appendChild(actionsTitle);

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
  }

  // Wait a bit before proceeding
  await sleep(1500);

  // Call completion callback
  if (onComplete) {
    onComplete();
  }
}
