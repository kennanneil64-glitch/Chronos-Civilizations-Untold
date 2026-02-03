import { GoogleGenAI, Type } from "@google/genai";

// Ensure API Key is available
const apiKey = process.env.API_KEY || '';

// --- AI ADVISOR (Text) ---
export const getAdvisorResponse = async (
  context: string,
  userMessage: string
): Promise<string> => {
  if (!apiKey) return "Error: API Key missing.";
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are an advisor in a 4X Strategy game set in a historical fantasy world. 
      The current game state context is: ${context}.
      
      User asks: ${userMessage}
      
      Provide a strategic, in-character response (max 2 sentences).`,
    });
    return response.text || "I'm contemplating our next move...";
  } catch (error) {
    console.error("Gemini Advisor Error:", error);
    return "The spirits are silent (API Error).";
  }
};

// --- IMAGE GENERATION (Pro Image) ---
export const generateGameAsset = async (
  prompt: string,
  size: '1K' | '2K' | '4K' = '1K'
): Promise<string | null> => {
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
            imageSize: size,
            aspectRatio: "16:9"
        }
      }
    });

    // Extract image from response parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    return null;
  }
};

// --- IMAGE EDITING (Flash Image) ---
export const editGameSnapshot = async (
  base64Image: string,
  prompt: string
): Promise<string | null> => {
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  // Ensure base64 string doesn't have the header for the API call if the SDK expects raw bytes,
  // but usually @google/genai inlineData handles the standard base64 string (minus the data:image... prefix).
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

     for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;

  } catch (error) {
    console.error("Gemini Image Edit Error:", error);
    return null;
  }
};
