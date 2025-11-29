import './style.css';
import { gameState } from './state/gameState.js';
import { renderPlayerSetup } from './components/playerSetup.js';
import { renderMatchDisplay } from './components/matchDisplay.js';
import { renderPlayerCard } from './components/playerCard.js';
import { renderActionNarrative } from './components/actionNarrative.js';
import { renderResultsDisplay } from './components/resultsDisplay.js';
import { generateMatch, generateMatchNarrative } from "./services/aiService.js";
import {
  validateBets,
  calculateWinner,
  calculatePayouts,
  applyPayoutsAndRoundMoney
} from './services/gameEngine.js';
import { createElement, clearElement } from './utils/dom.js';

const app = document.querySelector('#app');
let currentUnsubscribe = null;
let currentPhase = null;

// Main render function
async function render() {
  const state = gameState.getState();

  // Prevent re-rendering if we're already in this phase
  if (state.phase === currentPhase) {
    return;
  }
  currentPhase = state.phase;

  // Cleanup previous subscriptions
  if (currentUnsubscribe) {
    currentUnsubscribe();
    currentUnsubscribe = null;
  }

  switch (state.phase) {
    case 'SETUP':
      renderSetupPhase();
      break;
    case 'BETTING':
      await renderBettingPhase();
      break;
    case 'GENERATING':
      renderGeneratingPhase();
      break;
    case 'NARRATIVE':
      await renderNarrativePhase();
      break;
    case 'RESULTS':
      renderResultsPhase();
      break;
  }
}

function renderSetupPhase() {
  clearElement(app);
  currentUnsubscribe = renderPlayerSetup(app);
}

async function renderBettingPhase() {
  clearElement(app);

  const currentState = gameState.getState();
  let match;

  // Use pre-generated match if available, otherwise generate new one
  if (currentState.nextMatch) {
    console.log("🚀 Using pre-generated match for instant UX");
    match = currentState.nextMatch;
    gameState.updateMatch(match);
    gameState.setNextMatch(null); // Clear the pre-generated match
  } else {
    // Show loading while generating match
    const loadingDiv = createElement(
      "div",
      "flex items-center justify-center min-h-screen"
    );
    const loadingText = createElement(
      "div",
      "text-white text-3xl font-bold animate-pulse"
    );
    loadingText.textContent = "⚽ Generating match...";
    loadingDiv.appendChild(loadingText);
    app.appendChild(loadingDiv);

    // Generate match
    match = await generateMatch();
    gameState.updateMatch(match);

    clearElement(app);
  }

  // Now render betting interface

  const wrapper = createElement("div", "max-w-7xl mx-auto p-8");

  // Round number
  const roundHeader = createElement("div", "text-center mb-6");
  const roundNumber = createElement("h2", "text-3xl font-bold text-white");
  roundNumber.textContent = `Round ${gameState.getState().roundNumber}`;
  roundHeader.appendChild(roundNumber);
  wrapper.appendChild(roundHeader);

  // Match display
  const matchDisplay = renderMatchDisplay(match);
  wrapper.appendChild(matchDisplay);

  // Players section
  const playersCard = createElement(
    "div",
    "bg-white/10 backdrop-blur rounded-xl p-6 mb-6 shadow-xl"
  );
  const playersTitle = createElement(
    "h3",
    "text-2xl font-semibold text-white mb-4"
  );
  playersTitle.textContent = "Place Your Bets";
  playersCard.appendChild(playersTitle);

  const playersContainer = createElement(
    "div",
    "flex gap-4 overflow-x-auto pb-4"
  );
  playersContainer.id = "players-container";

  const state = gameState.getState();
  state.players.forEach((player) => {
    const playerCard = renderPlayerCard(player, match);
    playersContainer.appendChild(playerCard);
  });

  playersCard.appendChild(playersContainer);
  wrapper.appendChild(playersCard);

  // Error display
  const errorDiv = createElement("div", "mb-4 hidden");
  errorDiv.id = "error-display";
  wrapper.appendChild(errorDiv);

  // Place bets button
  const placeBetsBtn = createElement(
    "button",
    "w-full max-w-md mx-auto block bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors"
  );
  placeBetsBtn.textContent = "Place All Bets & Start Match";
  placeBetsBtn.addEventListener("click", async () => {
    const currentState = gameState.getState();
    const validation = validateBets(currentState.players);

    if (!validation.valid) {
      showErrors(validation.errors);
      return;
    }

    // Move to generating phase
    gameState.setPhase("GENERATING");
  });
  wrapper.appendChild(placeBetsBtn);

  app.appendChild(wrapper);

  // Subscribe to state changes to update only the bet choice buttons (not the whole cards)
  currentUnsubscribe = gameState.subscribe((state) => {
    if (state.phase !== "BETTING") return;

    // Update only the choice button rings without re-rendering entire cards
    state.players.forEach((player) => {
      const card = document.querySelector(`[data-player-id="${player.id}"]`);
      if (card) {
        // Update choice button highlights
        const buttons = card.querySelectorAll("button[data-choice]");
        buttons.forEach((btn) => {
          const choice = btn.getAttribute("data-choice");
          if (player.betChoice === choice) {
            btn.classList.add("ring-4", "ring-white");
          } else {
            btn.classList.remove("ring-4", "ring-white");
          }
        });

        // Update current bet display
        const existingBetDisplay = card.querySelector(".current-bet-display");
        if (existingBetDisplay) {
          existingBetDisplay.remove();
        }

        if (player.currentBet > 0 && player.betChoice !== "SKIP") {
          const currentBet = createElement(
            "div",
            "current-bet-display mt-4 text-center bg-green-600/30 rounded p-2"
          );
          const betText = createElement(
            "div",
            "text-white font-semibold text-sm"
          );
          betText.textContent = `Betting $${player.currentBet.toFixed(
            2
          )} on ${getChoiceLabelForUpdate(
            player.betChoice,
            state.currentMatch
          )}`;
          currentBet.appendChild(betText);
          card.appendChild(currentBet);
        }
      }
    });
  });

  function getChoiceLabelForUpdate(choice, match) {
    if (choice === "TEAM1") return match.team1;
    if (choice === "TEAM2") return match.team2;
    if (choice === "DRAW") return "Draw";
    return "Skip";
  }
}

function renderGeneratingPhase() {
  clearElement(app);

  const loadingDiv = createElement('div', 'flex items-center justify-center min-h-screen');
  const loadingText = createElement('div', 'text-white text-3xl font-bold animate-pulse');
  loadingText.textContent = '🎬 Generating match highlights...';
  loadingDiv.appendChild(loadingText);
  app.appendChild(loadingDiv);

  // Generate narrative and calculate result
  generateNarrativeAndResult();
}

async function generateNarrativeAndResult() {
  const state = gameState.getState();
  const match = state.currentMatch;

  // Calculate winner
  const result = calculateWinner(match.odds);
  console.log("🎲 Match result:", result);
  gameState.updateMatch({ result });

  // Generate narrative
  console.log("📝 Generating narrative for:", match.team1, "vs", match.team2, "Result:", result);
  const actions = await generateMatchNarrative(match.team1, match.team2, result);
  console.log("📝 Generated actions:", actions);
  gameState.updateMatch({ actions });

  // Verify actions were set
  const updatedState = gameState.getState();
  console.log("✅ Actions in state:", updatedState.currentMatch.actions);

  // Move to narrative phase
  gameState.setPhase('NARRATIVE');
}

async function renderNarrativePhase() {
  const state = gameState.getState();
  clearElement(app);

  // Start pre-generating the next match in the background for better UX
  console.log("🎬 Starting to pre-generate next match in background...");
  generateMatch()
    .then((nextMatch) => {
      console.log("✅ Next match pre-generated and ready:", nextMatch);
      gameState.setNextMatch(nextMatch);
    })
    .catch((error) => {
      console.error("❌ Failed to pre-generate next match:", error);
      // Don't throw - just means we'll generate on-demand later
    });

  await renderActionNarrative(
    app,
    state.currentMatch.actions,
    state.currentMatch,
    () => {
      gameState.setPhase("RESULTS");
    }
  );
}

function renderResultsPhase() {
  const state = gameState.getState();
  const match = state.currentMatch;

  // Calculate payouts
  const payoutResults = calculatePayouts(state.players, match.result, match.odds);

  // Apply payouts and round money to state (using configured round bonus)
  const updatedPlayers = applyPayoutsAndRoundMoney(state.players, payoutResults, state.roundBonus);
  gameState.setState({ players: updatedPlayers });

  // Update payout results with new balances
  const finalPayoutResults = payoutResults.map(result => {
    const updatedPlayer = updatedPlayers.find(p => p.id === result.playerId);
    return {
      ...result,
      newBalance: updatedPlayer.balance
    };
  });

  clearElement(app);
  renderResultsDisplay(app, finalPayoutResults, match);
}

function showErrors(errors) {
  const errorDiv = document.getElementById('error-display');
  if (!errorDiv) return;

  clearElement(errorDiv);
  errorDiv.classList.remove('hidden');

  const errorCard = createElement('div', 'bg-red-500/80 backdrop-blur rounded-lg p-4');
  const errorTitle = createElement('div', 'text-white font-bold text-lg mb-2');
  errorTitle.textContent = '⚠️ Errors:';
  errorCard.appendChild(errorTitle);

  const errorList = createElement('ul', 'text-white list-disc list-inside');
  errors.forEach(error => {
    const li = createElement('li');
    li.textContent = error;
    errorList.appendChild(li);
  });
  errorCard.appendChild(errorList);
  errorDiv.appendChild(errorCard);

  // Auto-hide after 5 seconds
  setTimeout(() => {
    errorDiv.classList.add('hidden');
  }, 5000);
}

// Subscribe to state changes
gameState.subscribe(() => {
  render();
});

// Initial render
render();
