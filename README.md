# Football Gambling Simulation Game

A fun web-based football gambling simulation where multiple players bet on AI-generated matches!

## Features

- **Multi-player Support**: Add as many players as you want with custom starting balances
- **AI-Generated Matches**: Gemini Flash generates creative team names and realistic odds
- **Dramatic Match Narratives**: AI creates exciting play-by-play action sequences
- **Skippable Animations**: Watch the action unfold or skip to results
- **Round Bonuses**: Every player gets $5 per round regardless of betting outcome
- **Infinite Gameplay**: Game continues indefinitely through rounds

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Gemini API Key

Create or edit the `.env` file in the project root:

```bash
VITE_GEMINI_API_KEY=your_actual_api_key_here
```

Get your free Gemini API key at: https://makersuite.google.com/app/apikey

### 3. Run Development Server

```bash
npm run dev
```

The game will be available at `http://localhost:5173` (or another port if 5173 is in use).

## How to Play

1. **Add Players**: Enter player names and starting balances, then click "Start Game"
2. **Place Bets**:
   - Each round, AI generates a new match with teams and odds
   - Enter your bet amount (or $0 to skip)
   - Select your prediction: Team 1, Draw, Team 2, or Skip
3. **Watch the Action**: Enjoy AI-generated match highlights (or skip them)
4. **See Results**: View payouts, updated balances, and get your $5 round bonus
5. **Next Round**: Click "Next Round" to continue playing!

## Game Mechanics

### Betting
- Bet any amount up to your current balance
- Choose which outcome to bet on (Team 1 win, Draw, or Team 2 win)
- Or bet $0 to skip the round

### Payouts
- **Win**: Receive your bet multiplied by the odds multiplier (minus original bet)
- **Loss**: Lose your bet amount
- **Skip**: No gain or loss

### Odds Multipliers
Odds are probabilities (sum to 1.0), converted to multipliers:
- 50% chance = 2x multiplier
- 25% chance = 4x multiplier
- 10% chance = 10x multiplier

### Round Bonus
Every player receives $5 at the end of each round, so no one is permanently eliminated!

## Technology Stack

- **Frontend**: Vanilla JavaScript with ES6 modules
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **AI**: Google Gemini Flash API
- **State Management**: Custom event-driven pattern

## Project Structure

```
src/
├── main.js                  # Application orchestrator
├── style.css                # Global styles and animations
├── state/
│   └── gameState.js         # State management
├── services/
│   ├── gameEngine.js        # Game logic (RNG, payouts)
│   └── geminiService.js     # AI integration
├── components/
│   ├── playerSetup.js       # Player creation UI
│   ├── matchDisplay.js      # Match info display
│   ├── playerCard.js        # Individual betting card
│   ├── actionNarrative.js   # Animated action sequence
│   └── resultsDisplay.js    # Round results
└── utils/
    ├── dom.js               # DOM helpers
    └── animations.js        # Animation utilities
```

## Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## Troubleshooting

### Gemini API Not Working
- Check that your API key is correctly set in `.env`
- Ensure the key starts with `VITE_GEMINI_API_KEY=`
- Restart the dev server after changing `.env`
- The game will use fallback data if the API is unavailable

### Tailwind Styles Not Loading
- Make sure all dependencies are installed: `npm install`
- Check that `@tailwindcss/postcss` is installed
- Restart the dev server

## License

MIT - Feel free to use and modify!
