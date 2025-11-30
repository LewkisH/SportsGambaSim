import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

// API Keys
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Determine which provider to use (OpenAI first, then Gemini)
let aiProvider = null;
let openaiClient = null;
let geminiModel = null;

if (OPENAI_API_KEY && OPENAI_API_KEY !== "your_openai_api_key_here") {
  aiProvider = "openai";
  openaiClient = new OpenAI({
    apiKey: OPENAI_API_KEY,
    model: "gpt-4.1-mini",
    dangerouslyAllowBrowser: true, // Required for client-side usage
  });
  console.log("✨ Using OpenAI (gpt-4o-mini) for AI generation");
} else if (GEMINI_API_KEY && GEMINI_API_KEY !== "your_api_key_here") {
  aiProvider = "gemini";
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  geminiModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-lite",
    generationConfig: {
      temperature: 2.0,
      topP: 1.0,
      topK: 64,
    },
  });
  console.log("✨ Using Gemini (gemini-2.0-flash-lite) for AI generation");
} else {
  console.warn(
    "⚠️ No AI provider configured. Add VITE_OPENAI_API_KEY or VITE_GEMINI_API_KEY to .env file"
  );
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

  if (aiProvider === "openai") {
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
        {
          role: "system",
          content:
            "You are a football match generator that returns valid JSON only.",
        },
        { role: "user", content: prompt },
      ],
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
 * Generate a realistic scoreline based on match result using bell curve distribution
 * Most likely outcome: 1-0 or 0-1
 * @param {string} result - 'TEAM1' | 'DRAW' | 'TEAM2'
 * @returns {{team1: number, team2: number}} Final score
 */
function generateScoreline(result) {
  // Helper function to generate goals with bell curve distribution (max 7)
  // Uses Box-Muller transform for normal distribution
  // Mean closer to 1.0 to make 1-0 most likely
  const generateGoals = () => {
    const mean = 0.9; // Average goals per team (peak at 1 goal)
    const stdDev = 0.8; // Narrower distribution for more concentrated outcomes

    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // Convert to goals (clamp between 0 and 7)
    let goals = Math.round(mean + stdDev * z);
    goals = Math.max(0, Math.min(7, goals));

    return goals;
  };

  if (result === "DRAW") {
    // For draws, both teams score the same
    const goals = generateGoals();
    return { team1: goals, team2: goals };
  } else if (result === "TEAM1") {
    // Team 1 wins - generate loser's goals first to bias toward 1-0
    let team2Goals = generateGoals();
    let team1Goals = generateGoals();

    // Ensure team1 wins by at least 1 goal
    if (team1Goals <= team2Goals) {
      team1Goals = team2Goals + 1;
    }

    // Cap at 7
    team1Goals = Math.min(7, team1Goals);

    return { team1: team1Goals, team2: team2Goals };
  } else {
    // Team 2 wins - generate loser's goals first to bias toward 0-1
    let team1Goals = generateGoals();
    let team2Goals = generateGoals();

    // Ensure team2 wins by at least 1 goal
    if (team2Goals <= team1Goals) {
      team2Goals = team1Goals + 1;
    }

    // Cap at 7
    team2Goals = Math.min(7, team2Goals);

    return { team1: team1Goals, team2: team2Goals };
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

  // Generate realistic scoreline
  const finalScore = generateScoreline(result);
  const totalGoals = finalScore.team1 + finalScore.team2;
  const highlightCount = totalGoals * 2; // 2x the goal amounts

  console.log(
    `📊 Generated scoreline: ${finalScore.team1}-${finalScore.team2} (${totalGoals} goals, ${highlightCount} highlights)`
  );

  if (!aiProvider) {
    console.log("No AI provider configured, using fallback narrative");
    return getFallbackNarrative(
      team1,
      team2,
      result,
      finalScore,
      highlightCount
    );
  }

  if (aiProvider === "openai") {
    return generateNarrativeWithOpenAI(
      team1,
      team2,
      result,
      finalScore,
      highlightCount
    );
  } else {
    return generateNarrativeWithGemini(
      team1,
      team2,
      result,
      finalScore,
      highlightCount
    );
  }
}

async function generateNarrativeWithOpenAI(
  team1,
  team2,
  result,
  finalScore,
  highlightCount
) {
  if (!openaiClient) {
    console.log("OpenAI client not configured, using fallback narrative");
    return getFallbackNarrative(
      team1,
      team2,
      result,
      finalScore,
      highlightCount
    );
  }

  // Ensure minimum highlights for low-scoring games
  const minHighlights = 6;
  let actualHighlightCount = Math.max(minHighlights, highlightCount);

  // 55% chance for thriller mode (1.5x more suspenseful moments)
  const isThrillerMode = Math.random() < 0.55;
  if (isThrillerMode) {
    actualHighlightCount = Math.round(actualHighlightCount * 1.5);
  }

  const resultText = `${team1} ${finalScore.team1} - ${finalScore.team2} ${team2}`;

  let prompt;

  if (isThrillerMode) {
    console.log("🎬 Generating THRILLER mode narrative!");
    prompt = `Generate a THRILLER match for: ${team1} vs ${team2}.
Final score MUST be: ${resultText}.

Return ONLY a JSON array of EXACTLY ${actualHighlightCount} action objects with this structure:
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
- The FINAL score MUST be EXACTLY: ${finalScore.team1}-${finalScore.team2}
- Scores should only change when goals are scored
- Generate ${
      finalScore.team1 + finalScore.team2
    } GOAL actions to reach the final score
- Return ONLY the JSON array, no additional text
Example: [{"text": "⚽ Kickoff! High stakes match begins!", "suspense": false, "score": {"team1": 0, "team2": 0}}, {"text": "⚡ GOAL! ${team1} scores!", "suspense": false, "score": {"team1": 1, "team2": 0}}]`;
  } else {
    prompt = `Generate exciting football match actions for: ${team1} vs ${team2}.
Final score MUST be: ${resultText}.

Return ONLY a JSON array of EXACTLY ${actualHighlightCount} action objects with this structure:
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
- The FINAL score MUST be EXACTLY: ${finalScore.team1}-${finalScore.team2}
- Scores should only change when goals are scored
- Generate ${
      finalScore.team1 + finalScore.team2
    } GOAL actions to reach the final score
- Return ONLY the JSON array, no additional text
Example: [{"text": "⚽ Kickoff! ${team1} vs ${team2}!", "score": {"team1": 0, "team2": 0}}, {"text": "⚡ GOAL! ${team1} strikes first!", "score": {"team1": 1, "team2": 0}}]`;
  }

  try {
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 2.0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a football match narrator that generates exciting action sequences as JSON. Always return valid JSON arrays.",
        },
        { role: "user", content: prompt },
      ],
    });

    const text = completion.choices[0].message.content;
    console.log("🤖 RAW OPENAI NARRATIVE OUTPUT:", text);

    const parsed = JSON.parse(text);

    // OpenAI might wrap the array in an object, so extract the array
    const actions = Array.isArray(parsed)
      ? parsed
      : parsed.actions || parsed.events || [];
    console.log("✅ PARSED ACTIONS:", actions);

    if (!Array.isArray(actions) || actions.length === 0) {
      console.warn("Invalid actions array, using fallback");
      return getFallbackNarrative(team1, team2, result, finalScore, highlightCount);
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
    const finalScoreCheck =
      normalizedActions[normalizedActions.length - 1]?.score;
    if (finalScoreCheck) {
      const scoreValid = validateFinalScore(finalScoreCheck, result);
      if (!scoreValid) {
        console.warn("Final score doesn't match result, using fallback");
        return getFallbackNarrative(
          team1,
          team2,
          result,
          finalScore,
          highlightCount
        );
      }
    }

    console.log("✅ RETURNING NORMALIZED ACTIONS:", normalizedActions);
    return normalizedActions;
  } catch (error) {
    console.error("Error generating narrative with OpenAI:", error);
    return getFallbackNarrative(
      team1,
      team2,
      result,
      finalScore,
      highlightCount
    );
  }
}

async function generateNarrativeWithGemini(
  team1,
  team2,
  result,
  finalScore,
  highlightCount
) {
  if (!geminiModel) {
    console.log("Gemini model not configured, using fallback narrative");
    return getFallbackNarrative(
      team1,
      team2,
      result,
      finalScore,
      highlightCount
    );
  }

  // Ensure minimum highlights for low-scoring games
  const minHighlights = 6;
  let actualHighlightCount = Math.max(minHighlights, highlightCount);

  // 55% chance for thriller mode (1.5x more suspenseful moments)
  const isThrillerMode = Math.random() < 0.55;
  if (isThrillerMode) {
    actualHighlightCount = Math.round(actualHighlightCount * 1.5);
  }

  const resultText = `${team1} ${finalScore.team1} - ${finalScore.team2} ${team2}`;

  let prompt;

  if (isThrillerMode) {
    console.log("🎬 Generating THRILLER mode narrative!");
    prompt = `Generate a THRILLER match for: ${team1} vs ${team2}.
Final score MUST be: ${resultText}.

Return ONLY a JSON array of EXACTLY ${actualHighlightCount} action objects with this structure:
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
- The FINAL score MUST be EXACTLY: ${finalScore.team1}-${finalScore.team2}
- Scores should only change when goals are scored
- Generate ${
      finalScore.team1 + finalScore.team2
    } GOAL actions to reach the final score
- Return ONLY the JSON array, no additional text
Example: [{"text": "⚽ Kickoff! High stakes match begins!", "suspense": false, "score": {"team1": 0, "team2": 0}}, {"text": "⚡ GOAL! ${team1} scores!", "suspense": false, "score": {"team1": 1, "team2": 0}}]`;
  } else {
    prompt = `Generate exciting football match actions for: ${team1} vs ${team2}.
Final score MUST be: ${resultText}.

Return ONLY a JSON array of EXACTLY ${actualHighlightCount} action objects with this structure:
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
- The FINAL score MUST be EXACTLY: ${finalScore.team1}-${finalScore.team2}
- Scores should only change when goals are scored
- Generate ${finalScore.team1 + finalScore.team2} GOAL actions to reach the final score
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
      return getFallbackNarrative(team1, team2, result, finalScore, highlightCount);
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
    const finalScoreCheck = normalizedActions[normalizedActions.length - 1]?.score;
    if (finalScoreCheck) {
      const scoreValid = validateFinalScore(finalScoreCheck, result);
      if (!scoreValid) {
        console.warn("Final score doesn't match result, using fallback");
        return getFallbackNarrative(team1, team2, result, finalScore, highlightCount);
      }
    }

    console.log("✅ RETURNING NORMALIZED ACTIONS:", normalizedActions);
    return normalizedActions;
  } catch (error) {
    console.error("Error generating narrative:", error);
    return getFallbackNarrative(team1, team2, result, finalScore, highlightCount);
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
function getFallbackNarrative(team1, team2, result, finalScore, highlightCount) {
  // Generate a simple narrative based on the scoreline
  const actions = [];
  const totalGoals = finalScore.team1 + finalScore.team2;
  const actualHighlightCount = Math.max(6, highlightCount || totalGoals * 2);

  // Kickoff
  actions.push({
    text: `⚽ Kickoff! ${team1} vs ${team2} begins!`,
    suspense: false,
    score: { team1: 0, team2: 0 }
  });

  // Generate goal actions to match the scoreline
  let currentScore = { team1: 0, team2: 0 };
  const goalsNeeded = [];

  // Create list of goals in order
  for (let i = 0; i < finalScore.team1; i++) {
    goalsNeeded.push('team1');
  }
  for (let i = 0; i < finalScore.team2; i++) {
    goalsNeeded.push('team2');
  }

  // Shuffle goals for variety
  for (let i = goalsNeeded.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [goalsNeeded[i], goalsNeeded[j]] = [goalsNeeded[j], goalsNeeded[i]];
  }

  // Distribute highlights between goals
  const highlightsPerGoal = Math.floor((actualHighlightCount - totalGoals - 1) / (totalGoals || 1));
  let goalIndex = 0;

  for (const goalTeam of goalsNeeded) {
    // Add a non-goal action before each goal
    if (actions.length < actualHighlightCount - goalsNeeded.length + goalIndex) {
      const team = goalTeam === 'team1' ? team1 : team2;
      const actionsTemplates = [
        `🏃 ${team} building up pressure`,
        `💨 Quick attack by ${team}`,
        `⚡ ${team} on the counter!`,
        `🎯 Great chance for ${team}!`
      ];
      actions.push({
        text: actionsTemplates[Math.floor(Math.random() * actionsTemplates.length)],
        suspense: false,
        score: { ...currentScore }
      });
    }

    // Add goal
    if (goalTeam === 'team1') {
      currentScore.team1++;
      actions.push({
        text: `⚽ GOAL! ${team1} scores! ${currentScore.team1}-${currentScore.team2}`,
        suspense: false,
        score: { ...currentScore }
      });
    } else {
      currentScore.team2++;
      actions.push({
        text: `⚽ GOAL! ${team2} scores! ${currentScore.team1}-${currentScore.team2}`,
        suspense: false,
        score: { ...currentScore }
      });
    }

    goalIndex++;
  }

  // Add final whistle
  actions.push({
    text: `⏱️ Final whistle! ${team1} ${finalScore.team1}-${finalScore.team2} ${team2}`,
    suspense: false,
    score: { team1: finalScore.team1, team2: finalScore.team2 }
  });

  return actions;
}
