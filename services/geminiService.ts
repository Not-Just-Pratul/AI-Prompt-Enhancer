// api/geminiClient.ts
import { GoogleGenAI, Type } from "@google/genai";
import { UploadedFile, AnalysisFeedback } from '../types';
import { PERSONAS } from '../data/personas';
import { PROMPT_MODES } from '../data/promptModes';

const getGeminiAI = () => {
    const apiKey = import.meta.env.VITE_API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API key not provided.");
    }
    return new GoogleGenAI({ apiKey });
};

const PERSONA_INSTRUCTIONS = PERSONAS.reduce((acc, p) => {
    if (p.instruction) {
        acc[p.key] = p.instruction;
    }
    return acc;
}, {} as { [key: string]: string });


/**
 * Robust base64 -> utf8 decoder that works on Node (Buffer) and browser (atob).
 * It also handles percent-encoding fallbacks like the original implementation attempted.
 */
const fromBase64 = (b64: string): string => {
    if (!b64) return '';
    // Try Node Buffer first (works on Vercel serverless / Node runtime)
    try {
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(b64, 'base64').toString('utf-8');
        }
    } catch (e) {
        // fallthrough to browser path
    }

    // Browser (atob) fallback
    try {
        const decoded = (typeof atob !== 'undefined')
            ? atob(b64)
            : String.fromCharCode(...Array.from(Buffer.from(b64, 'base64')));

        // try to decode percent-encoded sequences, else return raw
        try {
            return decodeURIComponent(decoded.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        } catch (e) {
            return decoded;
        }
    } catch (e) {
        console.error("Base64 decoding failed", e);
        return '';
    }
};


const fileToGenerativePart = (file: UploadedFile) => {
  return {
    inlineData: {
      data: file.data,
      mimeType: file.type,
    },
  };
};

export async function* generateAdvancedPrompt(
  idea: string,
  files: UploadedFile[],
  persona: string,
  mode: string,
): AsyncGenerator<string> {
  try {
    const ai = getGeminiAI();
    
    const modeData = PROMPT_MODES.find(m => m.key === mode) || PROMPT_MODES[0];
    const baseInstruction = modeData.instruction;

    const personaInstruction = PERSONA_INSTRUCTIONS[persona] || '';
    const systemInstruction = personaInstruction ? `${personaInstruction}\n\n${baseInstruction}` : baseInstruction;

    const textFiles = files.filter(f => f.type === 'text/plain');
    const otherFiles = files.filter(f => f.type !== 'text/plain');

    let combinedText = `User's core idea: "${idea}"\n\n`;

    if (textFiles.length > 0) {
        combinedText += "--- CONTEXT FROM UPLOADED DOCUMENTS ---\n\n";
        textFiles.forEach(file => {
            const fileContent = fromBase64(file.data);
            if (fileContent) {
                combinedText += `[Content from ${file.name}]:\n${fileContent}\n\n`;
            }
        });
        combinedText += "--------------------------------------\n\n";
    }

    const textPart = {
      text: combinedText,
    };

    const fileParts = otherFiles.map(fileToGenerativePart);
    const contents = { parts: [textPart, ...fileParts] };

    const response = await ai.models.generateContentStream({
      model: 'gemini-2.0-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
      },
    });

    for await (const chunk of response) {
      yield chunk.text;
    }
  } catch (error) {
    console.error("Error generating prompt with Gemini:", error);
    throw new Error("The AI model failed to generate a response. Please check your input and try again.");
  }
};


export const generateLuckyPrompt = async (): Promise<{ text: string, persona: string }> => {
    try {
        const ai = getGeminiAI();
        const personaList = PERSONAS.map(p => p.key).join(', ');

        const systemInstruction = `You are a creative idea generator. Your task is to invent a unique, random, and interesting prompt idea that a user could give to a powerful generative AI. The prompt idea should be a clear, descriptive sentence that suggests a complete task. You must also suggest the most suitable user persona for this prompt from the provided list. Respond ONLY in the specified JSON format.`;
        
        const contents = `Generate a creative prompt idea. The available personas are: ${personaList}.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ text: contents }],
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        prompt: {
                            type: Type.STRING,
                            description: 'The creative and unique prompt idea as a descriptive sentence that suggests a complete task.',
                        },
                        persona: {
                            type: Type.STRING,
                            description: `The most suitable persona from the list. Must be one of: ${personaList}`,
                        },
                    },
                    required: ['prompt', 'persona'],
                },
            },
        });

        const jsonString = response.text.trim();
        const parsed = JSON.parse(jsonString);

        if (parsed.prompt && parsed.persona) {
            return { text: parsed.prompt, persona: parsed.persona };
        } else {
            throw new Error("Invalid format received from AI.");
        }
    } catch (error) {
        console.error("Error generating lucky prompt:", error);
        throw new Error("The AI failed to generate a lucky prompt. Please try again.");
    }
};


export const analyzePrompt = async (prompt: string): Promise<AnalysisFeedback> => {
    try {
        const ai = getGeminiAI();
        const systemInstruction = `You are a world-class Prompt Engineering expert. Your task is to analyze a given prompt and provide a quality score and constructive feedback on three key areas: Clarity, Specificity, and Constraints.
        - Clarity: How clear and unambiguous is the prompt? Is the goal well-defined?
        - Specificity: Does the prompt provide enough detail (context, examples, format) for the AI to produce a high-quality, relevant response?
        - Constraints: Does the prompt effectively guide the AI on what to do and what to avoid?
        Scores must be an integer between 1 and 10.
        Provide a final one-sentence summary with the most important piece of advice for improvement.
        Respond ONLY in the specified JSON format.`;

        const contents = `Analyze the following prompt:\n\n---\n\n${prompt}`;

        const scoreSchema = {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.INTEGER },
                feedback: { type: Type.STRING },
            },
            required: ['score', 'feedback'],
        };
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        clarity: scoreSchema,
                        specificity: scoreSchema,
                        constraints: scoreSchema,
                        summary: { type: Type.STRING },
                    },
                    required: ['clarity', 'specificity', 'constraints', 'summary'],
                },
            },
        });
        
        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as AnalysisFeedback;

    } catch(error) {
        console.error("Error analyzing prompt:", error);
        throw new Error("The AI failed to analyze the prompt. Please try again.");
    }
}