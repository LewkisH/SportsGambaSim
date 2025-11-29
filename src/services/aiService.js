import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// API Keys
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Determine which provider to use (OpenAI first, then Gemini)
let aiProvider = null;
let openaiClient = null;
let geminiModel = null;

if (OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here') {
  aiProvider = 'openai';
  openaiClient = new OpenAI({
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Required for client-side usage
  });
  console.log('✨ Using OpenAI (gpt-4o-mini) for AI generation');
} else if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_api_key_here') {
  aiProvider = 'gemini';
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    generationConfig: {
      temperature: 2.0,
      topP: 1.0,
      topK: 64,
    },
  });
  console.log('✨ Using Gemini (gemini-2.5-flash) for AI generation');
} else {
  console.warn('⚠️ No AI provider configured. Add VITE_OPENAI_API_KEY or VITE_GEMINI_API_KEY to .env file');
}

/**
 * Generate a new match with team names and odds
 * @returns {Promise<Object>} { team1, team2, odds: { team1Win, draw, team2Win } }
 */
export async function generateMatch() {
  console.log("Generating new match...");
  if (!aiProvider) {
    console.log("No AI provider configured, using fallback match");
    return getFallbackMatch();
  }

  if (aiProvider === 'openai') {
    return generateMatchWithOpenAI();
  } else {
    return generateMatchWithGemini();
  }
}

async function generateMatchWithGemini() {
  if (!geminiModel) {
    return getFallbackMatch();
  }

  // Add random elements to prompt to prevent caching
  const randomNumber = Math.random();
  const timestamp = Date.now();
  const randomLeagues = [
    "Premier League",
    "La Liga",
    "Serie A",
    "Bundesliga",
    "Ligue 1",
  ];
  const suggestedLeague =
    randomLeagues[Math.floor(Math.random() * randomLeagues.length)];

  const prompt = `[Request ID: ${timestamp}-${randomNumber}]
Generate a unique football match for a gambling game, preferably from ${suggestedLeague}. Return ONLY valid JSON with this exact structure:
{
  "team1": "Real team name",
  "team2": "Real team name",
  "odds": {
    "team1Win": 0.45,
    "draw": 0.25,
    "team2Win": 0.30
  }
}

Requirements:
- Use ONLY REAL football teams from major leagues (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, MLS, etc.)
- Vary the teams across different leagues and countries to keep matches interesting
- Consider the teams' actual relative strengths when setting odds (stronger teams should have better odds)
- Odds MUST be realistic football betting probabilities with overround (sum > 1.0, typically 1.05-1.15)
- Use ONLY these realistic odds patterns (choose one):

HEAVY FAVORITES:
  {team1: 0.87, draw: 0.14, team2: 0.03} (Overround ~104%)
  {team1: 0.83, draw: 0.15, team2: 0.05} (Overround ~103%)
  {team1: 0.77, draw: 0.17, team2: 0.07} (Overround ~101%)

CLEAR FAVORITES:
  {team1: 0.71, draw: 0.17, team2: 0.10} (Overround ~98%)
  {team1: 0.67, draw: 0.19, team2: 0.13} (Overround ~99%)
  {team1: 0.63, draw: 0.19, team2: 0.17} (Overround ~99%)

FAVORITES:
  {team1: 0.56, draw: 0.22, team2: 0.20} (Overround ~98%)
  {team1: 0.50, draw: 0.23, team2: 0.25} (Overround ~98%)

EVEN MATCHES:
  {team1: 0.45, draw: 0.26, team2: 0.28} (Overround ~99%)
  {team1: 0.42, draw: 0.26, team2: 0.32} (Overround ~100%)
  {team1: 0.38, draw: 0.27, team2: 0.36} (Overround ~101%)

UNDERDOGS:
  {team1: 0.32, draw: 0.27, team2: 0.42} (Overround ~101%)
  {team1: 0.25, draw: 0.25, team2: 0.50} (Overround ~100%)
  {team1: 0.20, draw: 0.22, team2: 0.56} (Overround ~98%)

- Return ONLY the JSON, no additional text`;

  try {
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("🤖 RAW GEMINI OUTPUT:", text);

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("Could not extract JSON from response, using fallback");
      return getFallbackMatch();
    }

    const match = JSON.parse(jsonMatch[0]);
    console.log("✅ PARSED MATCH:", match);

    // Validate structure
    if (!match.team1 || !match.team2 || !match.odds) {
      console.warn("Invalid match structure, using fallback");
      return getFallbackMatch();
    }

    // Validate odds have realistic overround (bookmaker margin)
    // Realistic odds should sum between 0.95 and 1.20
    const sum = match.odds.team1Win + match.odds.draw + match.odds.team2Win;
    if (sum < 0.95 || sum > 1.2) {
      console.warn("Odds sum out of realistic range:", sum, "using fallback");
      return getFallbackMatch();
    }

    return match;
  } catch (error) {
    console.error("Error generating match with Gemini:", error);
    return getFallbackMatch();
  }
}

async function generateMatchWithOpenAI() {
  if (!openaiClient) {
    return getFallbackMatch();
  }

  // Add random elements to prompt to prevent caching
  const randomNumber = Math.random();
  const timestamp = Date.now();
  const randomLeagues = [
    "Premier League",
    "La Liga",
    "Serie A",
    "Bundesliga",
    "Ligue 1",
  ];
  const suggestedLeague =
    randomLeagues[Math.floor(Math.random() * randomLeagues.length)];

  const prompt = `[Request ID: ${timestamp}-${randomNumber}]
Generate a unique football match for a gambling game, preferably from ${suggestedLeague}. Return ONLY valid JSON with this exact structure:
{
  "team1": "Real team name",
  "team2": "Real team name",
  "odds": {
    "team1Win": 0.45,
    "draw": 0.25,
    "team2Win": 0.30
  }
}

Requirements:
- Use ONLY REAL football teams from major leagues (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, MLS, etc.)
- Vary the teams across different leagues and countries to keep matches interesting
- Consider the teams' actual relative strengths when setting odds (stronger teams should have better odds)
- Odds MUST be realistic football betting probabilities with overround (sum > 1.0, typically 1.05-1.15)
- Use ONLY these realistic odds patterns (choose one):

HEAVY FAVORITES:
  {team1: 0.87, draw: 0.14, team2: 0.03} (Overround ~104%)
  {team1: 0.83, draw: 0.15, team2: 0.05} (Overround ~103%)
  {team1: 0.77, draw: 0.17, team2: 0.07} (Overround ~101%)

CLEAR FAVORITES:
  {team1: 0.71, draw: 0.17, team2: 0.10} (Overround ~98%)
  {team1: 0.67, draw: 0.19, team2: 0.13} (Overround ~99%)
  {team1: 0.63, draw: 0.19, team2: 0.17} (Overround ~99%)

FAVORITES:
  {team1: 0.56, draw: 0.22, team2: 0.20} (Overround ~98%)
  {team1: 0.50, draw: 0.23, team2: 0.25} (Overround ~98%)

EVEN MATCHES:
  {team1: 0.45, draw: 0.26, team2: 0.28} (Overround ~99%)
  {team1: 0.42, draw: 0.26, team2: 0.32} (Overround ~100%)
  {team1: 0.38, draw: 0.27, team2: 0.36} (Overround ~101%)

UNDERDOGS:
  {team1: 0.32, draw: 0.27, team2: 0.42} (Overround ~101%)
  {team1: 0.25, draw: 0.25, team2: 0.50} (Overround ~100%)
  {team1: 0.20, draw: 0.22, team2: 0.56} (Overround ~98%)

- Return ONLY the JSON, no additional text`;

  try {
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 2.0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a football match generator that returns valid JSON only." },
        { role: "user", content: prompt }
      ]
    });

    const text = completion.choices[0].message.content;
    console.log("🤖 RAW OPENAI OUTPUT:", text);

    const match = JSON.parse(text);
    console.log("✅ PARSED MATCH:", match);

    // Validate structure
    if (!match.team1 || !match.team2 || !match.odds) {
      console.warn("Invalid match structure, using fallback");
      return getFallbackMatch();
    }

    // Validate odds have realistic overround
    const sum = match.odds.team1Win + match.odds.draw + match.odds.team2Win;
    if (sum < 0.95 || sum > 1.2) {
      console.warn("Odds sum out of realistic range:", sum, "using fallback");
      return getFallbackMatch();
    }

    return match;
  } catch (error) {
    console.error("Error generating match with OpenAI:", error);
    return getFallbackMatch();
  }
}

/**
 * Generate match narrative actions
 * @param {string} team1 - First team name
 * @param {string} team2 - Second team name
 * @param {string} result - 'TEAM1' | 'DRAW' | 'TEAM2'
 * @returns {Promise<Array<{text: string, suspense: boolean, score: {team1: number, team2: number}}>>} Array of action objects with text, suspense flag, and current score
 */
export async function generateMatchNarrative(team1, team2, result) {
  console.log("Generating match narrative...");
  if (!aiProvider) {
    console.log("No AI provider configured, using fallback narrative");
    return getFallbackNarrative(team1, team2, result);
  }

  if (aiProvider === 'openai') {
    return generateNarrativeWithOpenAI(team1, team2, result);
  } else {
    return generateNarrativeWithGemini(team1, team2, result);
  }
}

async function generateNarrativeWithOpenAI(team1, team2, result) {
  if (!openaiClient) {
    console.log("OpenAI client not configured, using fallback narrative");
    return getFallbackNarrative(team1, team2, result);
  }

  // 55% chance for thriller mode (3 extra suspenseful highlights)
  const isThrillerMode = Math.random() < 1.0;

  const resultText =
    result === "TEAM1"
      ? `${team1} wins`
      : result === "TEAM2"
      ? `${team2} wins`
      : "Draw";

  let prompt;

  if (isThrillerMode) {
    console.log("🎬 Generating THRILLER mode narrative!");
    prompt = `Generate a THRILLER match with 3 extra suspenseful highlights for: ${team1} vs ${team2}.
The match result is: ${resultText}.

Return ONLY a JSON array of 8-10 action objects with this structure:
[
  {"text": "Action 1", "suspense": false, "score": {"team1": 0, "team2": 0}},
  {"text": "Action 2", "suspense": true, "score": {"team1": 1, "team2": 0}},
  ...
]

Requirements for THRILLER MODE:
- Keep each action text SHORT and SIMPLE (under 15 words)
- Start EVERY action text with a relevant emoji (⚽🏃💨⚡🛡️🎯🔥💪👐🚨⏱️📺🟥🟨 etc.)
- Include DRAMATIC elements: VAR checks, red cards, penalties, injury time, goal-line clearances, controversial calls
- Make actions EXTREMELY suspenseful with nail-biting moments
- Build massive tension with near-misses and woodwork hits
- Actions should keep the outcome uncertain until the very end
- Mark 2-4 of the MOST SUSPENSEFUL moments with "suspense": true (VAR checks, last-minute chances, penalties, etc.)
- Other actions should have "suspense": false
- CRITICAL: Include "score" field with current score after each action
- The FINAL score MUST match the result: ${resultText}
- Scores should only change when goals are scored
- Return ONLY the JSON array, no additional text
Example: [{"text": "⚽ Kickoff! High stakes match begins!", "suspense": false, "score": {"team1": 0, "team2": 0}}, {"text": "⚡ GOAL! ${team1} scores!", "suspense": false, "score": {"team1": 1, "team2": 0}}]`;
  } else {
    prompt = `Generate 5-7 exciting football match actions for: ${team1} vs ${team2}.
The match result is: ${resultText}.

Return ONLY a JSON array of action objects with this structure:
[
  {"text": "Action 1", "score": {"team1": 0, "team2": 0}},
  {"text": "Action 2", "score": {"team1": 1, "team2": 0}},
  ...
]

Requirements:
- Keep each action SHORT and SIMPLE (under 15 words)
- Start EVERY action with a relevant emoji (⚽🏃💨⚡🛡️🎯🔥💪👐🚨⏱️ etc.)
- Make actions exciting but concise
- Actions should build up to the final result
- Include key moments like goals, saves, near-misses
- CRITICAL: Include "score" field with current score after each action
- The FINAL score MUST match the result: ${resultText}
- Scores should only change when goals are scored
- Actions should be appropriate for the result
- Return ONLY the JSON array, no additional text
Example: [{"text": "⚽ Kickoff! ${team1} vs ${team2}!", "score": {"team1": 0, "team2": 0}}, {"text": "⚡ GOAL! ${team1} strikes first!", "score": {"team1": 1, "team2": 0}}]`;
  }

  try {
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 2.0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a football match narrator that generates exciting action sequences as JSON. Always return valid JSON arrays." },
        { role: "user", content: prompt }
      ]
    });

    const text = completion.choices[0].message.content;
    console.log("🤖 RAW OPENAI NARRATIVE OUTPUT:", text);

    const parsed = JSON.parse(text);

    // OpenAI might wrap the array in an object, so extract the array
    const actions = Array.isArray(parsed) ? parsed : (parsed.actions || parsed.events || []);
    console.log("✅ PARSED ACTIONS:", actions);

    if (!Array.isArray(actions) || actions.length === 0) {
      console.warn("Invalid actions array, using fallback");
      return getFallbackNarrative(team1, team2, result);
    }

    // Normalize format and validate scores
    const normalizedActions = actions.map((action) => {
      let normalized;

      if (typeof action === "string") {
        // Legacy format: simple strings
        normalized = {
          text: action,
          suspense: false,
          score: { team1: 0, team2: 0 },
        };
      } else if (action.text) {
        // New format: objects with text, suspense, and score
        normalized = {
          text: action.text,
          suspense: action.suspense || false,
          score: action.score || { team1: 0, team2: 0 },
        };
      } else {
        // Fallback for unexpected format
        normalized = {
          text: String(action),
          suspense: false,
          score: { team1: 0, team2: 0 },
        };
      }

      return normalized;
    });

    // Validate final score matches result
    const finalScore = normalizedActions[normalizedActions.length - 1]?.score;
    if (finalScore) {
      const scoreValid = validateFinalScore(finalScore, result);
      if (!scoreValid) {
        console.warn("Final score doesn't match result, using fallback");
        return getFallbackNarrative(team1, team2, result);
      }
    }

    console.log("✅ RETURNING NORMALIZED ACTIONS:", normalizedActions);
    return normalizedActions;
  } catch (error) {
    console.error("Error generating narrative with OpenAI:", error);
    return getFallbackNarrative(team1, team2, result);
  }
}

async function generateNarrativeWithGemini(team1, team2, result) {
  if (!geminiModel) {
    console.log("Gemini model not configured, using fallback narrative");
    return getFallbackNarrative(team1, team2, result);
  }

  // 55% chance for thriller mode (3 extra suspenseful highlights)
  const isThrillerMode = Math.random() < 1.0;

  const resultText =
    result === "TEAM1"
      ? `${team1} wins`
      : result === "TEAM2"
      ? `${team2} wins`
      : "Draw";

  let prompt;

  if (isThrillerMode) {
    console.log("🎬 Generating THRILLER mode narrative!");
    prompt = `Generate a THRILLER match with 3 extra suspenseful highlights for: ${team1} vs ${team2}.
The match result is: ${resultText}.

Return ONLY a JSON array of 8-10 action objects with this structure:
[
  {"text": "Action 1", "suspense": false, "score": {"team1": 0, "team2": 0}},
  {"text": "Action 2", "suspense": true, "score": {"team1": 1, "team2": 0}},
  ...
]

Requirements for THRILLER MODE:
- Keep each action text SHORT and SIMPLE (under 15 words)
- Start EVERY action text with a relevant emoji (⚽🏃💨⚡🛡️🎯🔥💪👐🚨⏱️📺🟥🟨 etc.)
- Include DRAMATIC elements: VAR checks, red cards, penalties, injury time, goal-line clearances, controversial calls
- Make actions EXTREMELY suspenseful with nail-biting moments
- Build massive tension with near-misses and woodwork hits
- Actions should keep the outcome uncertain until the very end
- Mark 2-4 of the MOST SUSPENSEFUL moments with "suspense": true (VAR checks, last-minute chances, penalties, etc.)
- Other actions should have "suspense": false
- CRITICAL: Include "score" field with current score after each action
- The FINAL score MUST match the result: ${resultText}
- Scores should only change when goals are scored
- Return ONLY the JSON array, no additional text
Example: [{"text": "⚽ Kickoff! High stakes match begins!", "suspense": false, "score": {"team1": 0, "team2": 0}}, {"text": "⚡ GOAL! ${team1} scores!", "suspense": false, "score": {"team1": 1, "team2": 0}}]`;
  } else {
    prompt = `Generate 5-7 exciting football match actions for: ${team1} vs ${team2}.
The match result is: ${resultText}.

Return ONLY a JSON array of action objects with this structure:
[
  {"text": "Action 1", "score": {"team1": 0, "team2": 0}},
  {"text": "Action 2", "score": {"team1": 1, "team2": 0}},
  ...
]

Requirements:
- Keep each action SHORT and SIMPLE (under 15 words)
- Start EVERY action with a relevant emoji (⚽🏃💨⚡🛡️🎯🔥💪👐🚨⏱️ etc.)
- Make actions exciting but concise
- Actions should build up to the final result
- Include key moments like goals, saves, near-misses
- CRITICAL: Include "score" field with current score after each action
- The FINAL score MUST match the result: ${resultText}
- Scores should only change when goals are scored
- Actions should be appropriate for the result
- Return ONLY the JSON array, no additional text
Example: [{"text": "⚽ Kickoff! ${team1} vs ${team2}!", "score": {"team1": 0, "team2": 0}}, {"text": "⚡ GOAL! ${team1} strikes first!", "score": {"team1": 1, "team2": 0}}]`;
  }

  try {
    const apiResult = await geminiModel.generateContent(prompt);
    const response = await apiResult.response;
    const text = response.text();

    console.log("🤖 RAW NARRATIVE OUTPUT:", text);

    // Extract JSON array from response (handle markdown code blocks)
    let jsonText = text;

    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\s*/g, "").replace(/```\s*/g, "");

    // Extract JSON array
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.warn(
        "Could not extract JSON array from response, using fallback"
      );
      return getFallbackNarrative(team1, team2, result);
    }

    // Clean up the JSON string (remove extra whitespace/tabs that break parsing)
    let cleanedJson = jsonMatch[0]
      .replace(/\n\s+/g, "\n") // Remove extra spaces after newlines
      .replace(/\t/g, " ") // Replace tabs with spaces
      .trim();

    const actions = JSON.parse(cleanedJson);
    console.log("✅ PARSED ACTIONS:", actions);

    if (!Array.isArray(actions) || actions.length === 0) {
      console.warn("Invalid actions array, using fallback");
      return getFallbackNarrative(team1, team2, result);
    }

    // Normalize format and validate scores
    const normalizedActions = actions.map((action) => {
      let normalized;

      if (typeof action === "string") {
        // Legacy format: simple strings
        normalized = {
          text: action,
          suspense: false,
          score: { team1: 0, team2: 0 },
        };
      } else if (action.text) {
        // New format: objects with text, suspense, and score
        normalized = {
          text: action.text,
          suspense: action.suspense || false,
          score: action.score || { team1: 0, team2: 0 },
        };
      } else {
        // Fallback for unexpected format
        normalized = {
          text: String(action),
          suspense: false,
          score: { team1: 0, team2: 0 },
        };
      }

      return normalized;
    });

    // Validate final score matches result
    const finalScore = normalizedActions[normalizedActions.length - 1]?.score;
    if (finalScore) {
      const scoreValid = validateFinalScore(finalScore, result);
      if (!scoreValid) {
        console.warn("Final score doesn't match result, using fallback");
        return getFallbackNarrative(team1, team2, result);
      }
    }

    console.log("✅ RETURNING NORMALIZED ACTIONS:", normalizedActions);
    return normalizedActions;
  } catch (error) {
    console.error("Error generating narrative:", error);
    return getFallbackNarrative(team1, team2, result);
  }
}

/**
 * Fallback match generator (used when API fails or is not configured)
 */
function getFallbackMatch() {
  const teams = [
    ["Manchester United", "Liverpool"],
    ["Real Madrid", "Barcelona"],
    ["Bayern Munich", "Borussia Dortmund"],
    ["AC Milan", "Inter Milan"],
    ["Arsenal", "Chelsea"],
    ["PSG", "Lyon"],
    ["Ajax", "PSV"],
    ["Celtic", "Rangers"],
    ["The Thunderbolts", "The Lightning Strikers"],
    ["Dragon FC", "Phoenix United"],
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
      team2Win: parseFloat(rand3.toFixed(2)),
    },
  };
}

/**
 * Validate that final score matches the result
 */
function validateFinalScore(score, result) {
  if (result === "TEAM1") {
    return score.team1 > score.team2;
  } else if (result === "TEAM2") {
    return score.team2 > score.team1;
  } else if (result === "DRAW") {
    return score.team1 === score.team2;
  }
  return false;
}

/**
 * Fallback narrative generator
 */
function getFallbackNarrative(team1, team2, result) {
  const narratives = {
    TEAM1: [
      {
        text: `⚽ Kickoff! ${team1} vs ${team2} begins!`,
        suspense: false,
        score: { team1: 0, team2: 0 },
      },
      {
        text: `🏃 ${team1} dominates possession in the opening minutes`,
        suspense: false,
        score: { team1: 0, team2: 0 },
      },
      {
        text: `💨 A brilliant run down the wing by ${team1}'s striker!`,
        suspense: false,
        score: { team1: 0, team2: 0 },
      },
      {
        text: `⚡ GOAL! ${team1} takes the lead with a stunning strike!`,
        suspense: false,
        score: { team1: 1, team2: 0 },
      },
      {
        text: `🛡️ ${team2} pushes forward but ${team1}'s defense holds strong`,
        suspense: false,
        score: { team1: 1, team2: 0 },
      },
      {
        text: `🎯 Another goal! ${team1} extends their lead!`,
        suspense: false,
        score: { team1: 2, team2: 0 },
      },
      {
        text: `⏱️ Final whistle! ${team1} wins!`,
        suspense: false,
        score: { team1: 2, team2: 0 },
      },
    ],
    TEAM2: [
      {
        text: `⚽ Match begins! ${team1} vs ${team2}!`,
        suspense: false,
        score: { team1: 0, team2: 0 },
      },
      {
        text: `🏃 ${team2} starts aggressively, pressing high`,
        suspense: false,
        score: { team1: 0, team2: 0 },
      },
      {
        text: `💨 Quick counter-attack by ${team2}!`,
        suspense: false,
        score: { team1: 0, team2: 0 },
      },
      {
        text: `⚡ GOAL! ${team2} scores first!`,
        suspense: false,
        score: { team1: 0, team2: 1 },
      },
      {
        text: `🛡️ ${team1} struggles to break through ${team2}'s defense`,
        suspense: false,
        score: { team1: 0, team2: 1 },
      },
      {
        text: `🎯 ${team2} scores again on the break!`,
        suspense: false,
        score: { team1: 0, team2: 2 },
      },
      {
        text: `⏱️ Game over! ${team2} takes the victory!`,
        suspense: false,
        score: { team1: 0, team2: 2 },
      },
    ],
    DRAW: [
      {
        text: `⚽ The match kicks off between ${team1} and ${team2}!`,
        suspense: false,
        score: { team1: 0, team2: 0 },
      },
      {
        text: `🏃 Both teams trading attacks in a fast-paced game`,
        suspense: false,
        score: { team1: 0, team2: 0 },
      },
      {
        text: `⚡ GOAL! ${team1} opens the scoring!`,
        suspense: false,
        score: { team1: 1, team2: 0 },
      },
      {
        text: `💪 ${team2} fights back with intense pressure`,
        suspense: false,
        score: { team1: 1, team2: 0 },
      },
      {
        text: `⚡ GOAL! ${team2} equalizes!`,
        suspense: false,
        score: { team1: 1, team2: 1 },
      },
      {
        text: `🔥 End-to-end action but no one can find the winner`,
        suspense: false,
        score: { team1: 1, team2: 1 },
      },
      {
        text: `⏱️ Final whistle! It ends in a draw!`,
        suspense: false,
        score: { team1: 1, team2: 1 },
      },
    ],
  };

  return narratives[result];
}
