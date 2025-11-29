/**
 * Animation utilities
 */

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function fadeIn(element) {
  element.classList.add('fade-in');
}

export function slideUp(element) {
  element.classList.add('slide-up');
}

export async function animateSequence(items, callback, delay = 800) {
  for (const item of items) {
    await callback(item);
    await sleep(delay);
  }
}
