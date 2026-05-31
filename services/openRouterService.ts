import { UploadedFile, AnalysisFeedback } from '../types';
import { PERSONAS } from '../data/personas';
import { PROMPT_MODES } from '../data/promptModes';

const API_ENDPOINT = '/api/chat';
const MODEL = 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free';

const BASE_HEADERS = {
    'Content-Type': 'application/json',
} as const;

const PERSONA_INSTRUCTIONS = PERSONAS.reduce((acc, p) => {
    if (p.instruction) acc[p.key] = p.instruction;
    return acc;
}, {} as { [key: string]: string });

const fromBase64 = (b64: string): string => {
    if (!b64) return '';
    try {
        if (typeof Buffer !== 'undefined') return Buffer.from(b64, 'base64').toString('utf-8');
    } catch (_) {}
    try {
        const decoded = atob(b64);
        try {
            return decodeURIComponent(decoded.split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        } catch (_) {
            return decoded;
        }
    } catch (e) {
        console.error("Base64 decoding failed", e);
        return '';
    }
};

async function openRouterStream(systemPrompt: string, userContent: string): Promise<AsyncGenerator<string>> {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: BASE_HEADERS,
        body: JSON.stringify({
            model: MODEL,
            stream: true,
            temperature: 1.2,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent },
            ],
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`API error: ${response.status} ${err}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    async function* gen(): AsyncGenerator<string> {
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';
            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) continue;
                const data = trimmed.slice(5).trim();
                if (data === '[DONE]') return;
                try {
                    const parsed = JSON.parse(data);
                    const text = parsed.choices?.[0]?.delta?.content;
                    if (text) yield text;
                } catch (_) {}
            }
        }
    }

    return gen();
}

async function openRouterJSON<T>(systemPrompt: string, userContent: string): Promise<T> {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: BASE_HEADERS,
        body: JSON.stringify({
            model: MODEL,
            temperature: 1.2,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userContent },
            ],
            response_format: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`API error: ${response.status} ${err}`);
    }

    const json = await response.json();
    const text = json.choices?.[0]?.message?.content ?? '';
    return JSON.parse(text) as T;
}

export async function* generateAdvancedPrompt(
    idea: string,
    files: UploadedFile[],
    persona: string,
    mode: string,
): AsyncGenerator<string> {
    try {
        const modeData = PROMPT_MODES.find(m => m.key === mode) || PROMPT_MODES[0];
        const personaInstruction = PERSONA_INSTRUCTIONS[persona] || '';
        const systemInstruction = personaInstruction
            ? `${personaInstruction}\n\n${modeData.instruction}`
            : modeData.instruction;

        const textFiles = files.filter(f => f.type === 'text/plain');
        let userContent = `User's core idea: "${idea}"\n\n`;

        if (textFiles.length > 0) {
            userContent += "--- CONTEXT FROM UPLOADED DOCUMENTS ---\n\n";
            textFiles.forEach(file => {
                const content = fromBase64(file.data);
                if (content) userContent += `[Content from ${file.name}]:\n${content}\n\n`;
            });
            userContent += "--------------------------------------\n\n";
        }

        const stream = await openRouterStream(systemInstruction, userContent);
        for await (const chunk of stream) yield chunk;
    } catch (error) {
        console.error("Error generating prompt:", error);
        throw new Error("The AI model failed to generate a response. Please check your input and try again.");
    }
}

export const generateLuckyPrompt = async (): Promise<{ text: string; persona: string }> => {
    try {
        const personaList = PERSONAS.map(p => p.key).join(', ');
        const systemInstruction = `You are a creative idea generator. Invent a unique, random, and interesting prompt idea that a user could give to a powerful generative AI. The prompt idea should be a clear, descriptive sentence suggesting a complete task. Also suggest the most suitable persona from the provided list. Respond ONLY in valid JSON with keys "prompt" and "persona".`;
        const userContent = `Generate a creative prompt idea. Available personas: ${personaList}.`;

        const parsed = await openRouterJSON<{ prompt: string; persona: string }>(systemInstruction, userContent);
        if (parsed.prompt && parsed.persona) return { text: parsed.prompt, persona: parsed.persona };
        throw new Error("Invalid format received from AI.");
    } catch (error) {
        console.error("Error generating lucky prompt:", error);
        throw new Error("The AI failed to generate a lucky prompt. Please try again.");
    }
};

export const analyzePrompt = async (prompt: string): Promise<AnalysisFeedback> => {
    try {
        const systemInstruction = `You are a world-class Prompt Engineering expert. Analyze the given prompt and provide a quality score and constructive feedback on three key areas: Clarity, Specificity, and Constraints.
- Clarity: How clear and unambiguous is the prompt?
- Specificity: Does the prompt provide enough detail for a high-quality response?
- Constraints: Does the prompt effectively guide the AI on what to do and avoid?
Scores must be integers between 1 and 10. Provide a final one-sentence summary with the most important improvement advice.
Respond ONLY in valid JSON matching this shape: { clarity: { score, feedback }, specificity: { score, feedback }, constraints: { score, feedback }, summary }`;

        const userContent = `Analyze the following prompt:\n\n---\n\n${prompt}`;
        return await openRouterJSON<AnalysisFeedback>(systemInstruction, userContent);
    } catch (error) {
        console.error("Error analyzing prompt:", error);
        throw new Error("The AI failed to analyze the prompt. Please try again.");
    }
};
