
import type { Grade, MathTopic, OperationType, MathExercise } from '../types';

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

export const generateExercise = async (topic: MathTopic, grade: Grade, operationType?: OperationType, lastOperationTypeToAvoid?: OperationType): Promise<MathExercise | null> => {
    try {
        const exerciseData = await callApi<MathExercise>('generateExercise', { topic, grade, operationType, lastOperationTypeToAvoid });
        return exerciseData;
    } catch (error) {
        console.error("Failed to generate exercise via API:", error);
        return null;
    }
};
