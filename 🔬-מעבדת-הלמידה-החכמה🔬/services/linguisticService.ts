
import type { Student, LinguisticAnswers, Grade, ComprehensionData, Color } from '../types';

// Helper to make API calls to our own backend
async function callApi<T>(task: string, payload: object): Promise<T> {
    const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task, payload }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown API error occurred' }));
        console.error("API Error Response:", errorData);
        throw new Error(`API Error: ${errorData.error || response.statusText}`);
    }

    return response.json();
}

export const generateStory = async (student: Student, answers: LinguisticAnswers): Promise<string> => {
    const data = await callApi<{ text: string }>('generateStory', { student, answers });
    return data.text;
};

export const addNikud = async (text: string): Promise<string> => {
    const data = await callApi<{ text: string }>('addNikud', { text });
    return data.text;
};

export const generateQuestions = async (story: string, grade: Grade): Promise<ComprehensionData> => {
    // The API now directly returns the ComprehensionData object
    const data = await callApi<ComprehensionData>('generateQuestions', { story, grade });
    if (!data || !data.mcqs || !data.openQuestions) {
        throw new Error('Invalid JSON structure for comprehension questions received from API.');
    }
    return data;
};

export const generateImage = async (story: string, studentName: string, comprehensionAnswers: string[], colors: Color[]): Promise<string | null> => {
    const data = await callApi<{ imageBase64: string | null }>('generateImage', { story, studentName, comprehensionAnswers, colors });
    return data.imageBase64;
};
