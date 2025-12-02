import { GoogleGenAI } from "@google/genai";

// Safe access to process.env to prevent ReferenceError in browsers
const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
const ai = new GoogleGenAI({ apiKey });

export const getChemistryHelp = async (context: string, userQuery: string): Promise<string> => {
  if (!apiKey) return "API Key missing. Please configure environment.";

  try {
    const systemInstruction = `You are a world-class chemistry tutor designed to help students understand atomic bonding. 
    Keep explanations concise (under 3 sentences), encouraging, and focused on the specific concept (Octet rule, Electronegativity, Lewis Structures, or VSEPR).
    Do not give the answer directly if possible, but guide them.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Context: ${context}\nUser Question: ${userQuery}`,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 0 } // Speed over deep thought for UI feedback
      }
    });

    return response.text || "I couldn't generate a hint right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the chemistry lab database (API Error).";
  }
};