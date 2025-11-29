import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY || API_KEY === 'your_api_key_here') {
  console.warn('⚠️ Gemini API key not configured. Please add VITE_GEMINI_API_KEY to .env file');
}

const genAI = API_KEY && API_KEY !== 'your_api_key_here'
  ? new GoogleGenerativeAI(API_KEY)
  : null;

const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

/**
 * Generate a new match with team names and odds
 * @returns {Promise<Object>} { team1, team2, odds: { team1Win, draw, team2Win } }
 */
export async function generateMatch() {
  if (!model) {
    return getFallbackMatch();
  }

  const prompt = `Generate a football match for a gambling game. Return ONLY valid JSON with this exact structure:
{
  "team1": "Creative team name",
  "team2": "Creative team name",
  "odds": {
    "team1Win": 0.45,
    "draw": 0.25,
    "team2Win": 0.30
  }
}

Requirements:
- Ensure odds sum to 1.0
- Make team names creative, varied, and interesting (can be real teams, fictional teams, or humorous names)
- Odds should be realistic (no team with 0.95 probability)
- Return ONLY the JSON, no additional text`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('Could not extract JSON from response, using fallback');
      return getFallbackMatch();
    }

    const match = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!match.team1 || !match.team2 || !match.odds) {
      console.warn('Invalid match structure, using fallback');
      return getFallbackMatch();
    }

    // Normalize odds to sum to 1.0
    const sum = match.odds.team1Win + match.odds.draw + match.odds.team2Win;
    if (Math.abs(sum - 1.0) > 0.01) {
      match.odds.team1Win /= sum;
      match.odds.draw /= sum;
      match.odds.team2Win /= sum;
    }

    return match;
  } catch (error) {
    console.error('Error generating match:', error);
    return getFallbackMatch();
  }
}

/**
 * Generate match narrative actions
 * @param {string} team1 - First team name
 * @param {string} team2 - Second team name
 * @param {string} result - 'TEAM1' | 'DRAW' | 'TEAM2'
 * @returns {Promise<Array<string>>} Array of action strings
 */
export async function generateMatchNarrative(team1, team2, result) {
  if (!model) {
    return getFallbackNarrative(team1, team2, result);
  }

  const resultText = result === 'TEAM1' ? `${team1} wins` :
                     result === 'TEAM2' ? `${team2} wins` :
                     'Draw';

  const prompt = `Generate 5-7 exciting football match actions for: ${team1} vs ${team2}.
The match result is: ${resultText}.

Return ONLY a JSON array of action strings:
["Action 1", "Action 2", "Action 3", ...]

Requirements:
- Make actions dramatic and exciting
- Actions should build up to the final result
- Include key moments like goals, saves, near-misses
- Actions should be appropriate for the result
- Return ONLY the JSON array, no additional text`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn('Could not extract JSON array from response, using fallback');
      return getFallbackNarrative(team1, team2, result);
    }

    const actions = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(actions) || actions.length === 0) {
      console.warn('Invalid actions array, using fallback');
      return getFallbackNarrative(team1, team2, result);
    }

    return actions;
  } catch (error) {
    console.error('Error generating narrative:', error);
    return getFallbackNarrative(team1, team2, result);
  }
}

/**
 * Fallback match generator (used when API fails or is not configured)
 */
function getFallbackMatch() {
  const teams = [
    ['Manchester United', 'Liverpool'],
    ['Real Madrid', 'Barcelona'],
    ['Bayern Munich', 'Borussia Dortmund'],
    ['AC Milan', 'Inter Milan'],
    ['Arsenal', 'Chelsea'],
    ['PSG', 'Lyon'],
    ['Ajax', 'PSV'],
    ['Celtic', 'Rangers'],
    ['The Thunderbolts', 'The Lightning Strikers'],
    ['Dragon FC', 'Phoenix United'],
  ];

  const [team1, team2] = teams[Math.floor(Math.random() * teams.length)];

  // Generate random but realistic odds
  const rand1 = 0.2 + Math.random() * 0.4; // 0.2 to 0.6
  const rand2 = 0.15 + Math.random() * 0.25; // 0.15 to 0.4
  const rand3 = 1 - rand1 - rand2;

  return {
    team1,
    team2,
    odds: {
      team1Win: parseFloat(rand1.toFixed(2)),
      draw: parseFloat(rand2.toFixed(2)),
      team2Win: parseFloat(rand3.toFixed(2))
    }
  };
}

/**
 * Fallback narrative generator
 */
function getFallbackNarrative(team1, team2, result) {
  const narratives = {
    TEAM1: [
      `⚽ Kickoff! ${team1} vs ${team2} begins!`,
      `🏃 ${team1} dominates possession in the opening minutes`,
      `💨 A brilliant run down the wing by ${team1}'s striker!`,
      `⚡ GOAL! ${team1} takes the lead with a stunning strike!`,
      `🛡️ ${team2} pushes forward but ${team1}'s defense holds strong`,
      `🎯 Another goal! ${team1} extends their lead!`,
      `⏱️ Final whistle! ${team1} wins!`
    ],
    TEAM2: [
      `⚽ Match begins! ${team1} vs ${team2}!`,
      `🏃 ${team2} starts aggressively, pressing high`,
      `💨 Quick counter-attack by ${team2}!`,
      `⚡ GOAL! ${team2} scores first!`,
      `🛡️ ${team1} struggles to break through ${team2}'s defense`,
      `🎯 ${team2} scores again on the break!`,
      `⏱️ Game over! ${team2} takes the victory!`
    ],
    DRAW: [
      `⚽ The match kicks off between ${team1} and ${team2}!`,
      `🏃 Both teams trading attacks in a fast-paced game`,
      `⚡ GOAL! ${team1} opens the scoring!`,
      `💪 ${team2} fights back with intense pressure`,
      `⚡ GOAL! ${team2} equalizes!`,
      `🔥 End-to-end action but no one can find the winner`,
      `⏱️ Final whistle! It ends in a draw!`
    ]
  };

  return narratives[result];
}
