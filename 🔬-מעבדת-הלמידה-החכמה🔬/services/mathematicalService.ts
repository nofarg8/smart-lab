import type { Grade, MathTopic, OperationType, MathExercise } from '../types';

// Call the backend API with the proper task and payload
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

const parseJsonResponse = <T,>(jsonString: string): T | null => {
    let cleanJsonString = jsonString.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = cleanJsonString.match(fenceRegex);
    if (match && match[2]) {
        cleanJsonString = match[2].trim();
    }
    try {
        return JSON.parse(cleanJsonString) as T;
    } catch (error) {
        console.error("Failed to parse JSON response:", error, "Raw string:", jsonString);
        return null;
    }
};

const gradeToMathCurriculumMap: Record<Grade, string> = {
    'ג': `
    - **Numbers & Operations:** Addition/subtraction up to 10,000. Two-digit multiplication. Simple division (with and without remainder). Rounding. Parentheses. Missing number problems.
    - **Fractions:** STRICTLY identifying basic visual fractions (e.g., 1/2, 1/3, 1/4). The only problem type is "What fraction is shown in the picture?". NO calculations (no addition, no subtraction, no finding 'part of a quantity').
    - **Geometry:** Triangles, angles. Area/perimeter of a rectangle. Volume of a cuboid.
    `,
    'ד': `
    - **Numbers & Operations:** All 4 operations on larger numbers. Estimation. Decimal structure. Division with remainder.
    - **Fractions:** Addition/subtraction of fractions with common or related denominators. Introduction to multiplying a whole number by a fraction ('part of a quantity').
    - **Geometry:** Properties of squares and rectangles. Symmetry, heights, tessellation.
    `,
    'ה': `
    - **Numbers & Operations:** All 4 operations on large numbers.
    - **Fractions:** All 4 operations on simple and decimal fractions. Conversion between fraction types. Rounding fractions. Solving fraction word problems, including 'part of a quantity'.
    - **Geometry:** Introduction to circles. Volume measurement and units. Net of solids.
    - **Average:** Calculating the average of a set of numbers.
    `,
    'ו': `
    - **Numbers & Operations:** Summary of all number sets. Relationships between operations.
    - **Fractions, Decimals, Percentages & Ratios:** Complex problems involving all 4 operations, percentages, and ratios. Multi-step word problems are central.
    - **Average:** Solving complex problems involving average.
    - **Geometry:** Volume and area calculations. Classifying complex solids.
    `
};

const getPromptForTopic = (topic: MathTopic, grade: Grade, isFollowUp: boolean = false, operationType?: OperationType, lastOperationTypeToAvoid?: OperationType): string => {
    // Adding a random seed to encourage unique outputs from the model on each run.
    const randomSeed = Math.floor(Math.random() * 10000);

    let baseInstructions = `
    You are an expert math teacher for Israeli elementary school students.
    Your task is to generate a math problem, an SVG visualization for it, the correct answer, and TWO versions of a step-by-step explanation.
    The output MUST be a single JSON object.
    To ensure variety, use this random seed to create a unique problem: ${randomSeed}.

    **Pedagogical Constraints (Non-Negotiable):**
    You MUST strictly follow the curriculum for grade ${grade}:
    ${gradeToMathCurriculumMap[grade]}

    Problem details:
    - Language: Hebrew
    - Mathematical Symbols: For the 'problemText', you MUST use standard symbols: '+' for addition, '-' for subtraction, '×' for multiplication (NEVER 'x' or '*'), and '÷' for division (NEVER '/').
    - Fraction Formatting:
        - When a fraction appears in the 'problemText', you MUST format it ONLY as 'numerator/denominator' (e.g., '1/3').
        - For mixed numbers, the format MUST be 'integer numerator/denominator' (e.g., '2 1/4'). You are strictly forbidden from inserting any Hebrew words like 'ו' inside the number itself. '2 1/4' is correct; '2 ו 1/4' is incorrect and a failure.
    - Context: Use relatable, everyday scenarios for word problems.
    - Simplicity: ${isFollowUp ? 'This is a follow-up question for a student who made a mistake. Make it simpler than a standard question for this grade.' : 'Create a standard question for this grade that is creative and not a trivial example.'}
    - Answer Format:
        - For division with a remainder, the answer string MUST be in the format 'quotient,remainder' (e.g., "7,1").
        - For fractions, the answer string MUST be in the format 'numerator/denominator' (e.g., "1/3") or for mixed numbers as 'integer numerator/denominator' (e.g., "5 1/2").
        - For all other problems, it's a single number string.
    
    Explanation Rules:
    - **Main Explanation:** You MUST provide a step-by-step 'explanation'. It should be formatted with numbered steps and Markdown bolding (**text**) for emphasis. This version MUST include the final answer.
    - **Explanation Hint:** You MUST ALSO provide an 'explanationHint'. This should be the EXACT same step-by-step explanation, but with the final numerical answer carefully REMOVED and replaced with a placeholder like '___'.
    - **Formatting Equations:** Any full line that is a mathematical equation (e.g., "200 - 120 = 80") MUST be on its own separate line. This is critical for display formatting.
    `;
    
    let topicInstructions = '';
    switch (topic) {
        case '4_operations':
            let operationToRequest = `**Randomly choose ONE** of the four operations (addition, subtraction, multiplication, division).`;
            if (isFollowUp && operationType) {
                operationToRequest = `You MUST use the operation: **${operationType}**. This is a CRITICAL instruction for a follow-up question.`;
            } else if (lastOperationTypeToAvoid) {
                operationToRequest = `**Randomly choose ONE** of the four operations (addition, subtraction, multiplication, division), but it MUST NOT be **${lastOperationTypeToAvoid}**.`;
            }

            topicInstructions = `
            Topic: The Four Basic Arithmetic Operations.
            - ${operationToRequest}
            - **Variety and Creativity:** Create a problem that is NOT a trivial example. Use a diverse and challenging range of numbers suitable for the grade level. Ensure you generate different types of problems and avoid repetition.
            - **Critical \\problemText\\ Rule:** The 'problemText' MUST contain ONLY the mathematical expression itself (e.g., "25 × 14", "357 ÷ 8"). It MUST NOT contain any surrounding Hebrew words or questions like "כמה שווה?" or "פתרו:".
            - **Division Rule:** For division problems, you are STRICTLY FORBIDDEN from generating problems that involve decimal numbers. The problems must use whole numbers and may result in a remainder.
            - **Vertical Format:** For problems involving two multi-digit numbers (e.g., 25 × 14 or 123 + 45), format the problemText to be vertical, using newline characters. Example: "  25\\n× 14\\n----".
            - **Explanation for Multiplication:** If the explanation for multi-digit multiplication uses the distributive property (חוק הפילוג) instead of the standard vertical algorithm, it MUST start with the exact phrase "נפתור את התרגיל בעזרת: **חוק הפילוג**:" on its own line before the first numbered step.
            - **SVG Visualization:** For this topic, the SVG should be a simple, non-pedagogical illustration related to math (like an abacus, pencils, a notebook). It must NOT show the steps for solving.
            - **Return Operation Type:** Your JSON response MUST include the "operationType" field, indicating which operation you chose (e.g., "multiplication").
            `;
            break;
        case 'fractions':
            topicInstructions = `
            Topic: Fractions Practice.
            - **CRITICAL \\problemText\\ Rule:** The 'problemText' MUST contain ONLY the mathematical expression itself (e.g., "1/2 + 3/4" or "1 1/2 × 3/4") OR a direct conceptual question (e.g., "איזה מספר גדול יותר: 3/4 או 0.7?"). It MUST NOT contain any surrounding words, labels, or questions like "חשבו:" or "תרגיל 1:", and it MUST NOT contain invalid placeholders like '?' acting as an operator. This is a critical rule for display formatting.
            - **Exercise Types & Variety:** You MUST ensure a high variety of problems and not just focus on difficult calculations. Use the full range of appropriate exercise types:
                1.  **Calculation:** Simple and complex calculations appropriate for the grade (e.g., "1/4 + 2/4", "1 1/2 × 3/4").
                2.  **Comparison:** For comparison problems, you MUST ask a direct question about which number is larger or smaller. You are STRICTLY FORBIDDEN from using the vague phrase "השוו בין...". Instead, you MUST use clear and direct questions. Examples of GOOD questions: "איזה מספר גדול יותר: 3/4 או 0.7?", "איזה מספר קטן יותר: 1/5 או 1/6?", "סמנו את הסימן הנכון: 1/2 __ 3/5 (<, >, =)". The problem text should be the full question. The answer in the JSON should be the correct number (if asked which is bigger/smaller) or the correct symbol.
                3.  **Equivalence:** (e.g., "מצא שבר שווה ערך ל- 2/3").
                4.  **Theory/Concept:** (e.g., "בשבר 3/4, מהו המונה?", "מהו מספר מעורב?").
                5.  **Visual Identification:** (Mostly for lower grades) Ask to identify the fraction shown in the visualization.
            - **Gradual Difficulty (Very Important):** For any given grade, about 20-30% of the generated problems should be review questions based on the curriculum of the *previous* grade level. This creates a more pleasant and less intimidating experience. For higher grades (ו'), balance complex calculations with more conceptual questions.
            - **SVG:** The SVG should visually represent the core concept of the problem (e.g., showing fractions for comparison, or a shape for identification). It must not give away the answer.
            `;
            if (grade === 'ג') {
                topicInstructions += `
                \\n**NON-NEGOTIABLE RULE FOR GRADE ג':** You are FORBIDDEN from generating any problem that involves calculation or finding a 'part of a quantity'. The ONLY permitted problem type is showing a visual and asking the student to identify the fraction.
                - The 'problemText' MUST be a simple question like "איזה שבר מתאר החלק הצבוע בציור?".
                - The SVG MUST be the core of the question, showing a clear shape with parts colored in.
                - Example: Problem text is "What fraction is colored?", SVG shows a circle in 4 parts with 1 part colored, Answer is "1/4".
                - Any other type of question for this grade is a failure to follow instructions.
                `;
            } else {
                 topicInstructions += `\\n**Curriculum Focus for Grade ${grade}**: Based on the curriculum, create an appropriate exercise focusing on the varied types listed above, ensuring a mix of difficulty.`;
            }
            break;
        case 'average':
            topicInstructions = `
            Topic: Average.
            - **Variety and Creativity:** Generate a unique and creative set of numbers for the average problem each time. Instead of just a list of numbers, you can embed them in a very short, one-sentence story (e.g., "מצאו את הממוצע של הציונים 80, 90 ו-100."). Ensure the numbers are appropriate for the grade level.
            - **SVG Visualization Rule:** The visualization MUST be a bar graph that ONLY represents the set of numbers in the problem. It is CRITICALLY IMPORTANT that you DO NOT include the final average value, the average line, or any hints to the solution in the SVG. The graph must only present the data.
            `;
            break;
        case 'word_problems':
            const wordProblemType = (grade === 'ה' || grade === 'ו') 
                ? "Randomly select the type of word problem: either one using the 4 basic arithmetic operations, OR a problem about fractions (like finding a part of a quantity, 'חלק מכמות')."
                : "The word problem MUST use one of the four basic arithmetic operations (addition, subtraction, multiplication, division).";

            topicInstructions = `
            Topic: Word Problems.
            - **Problem Type:** ${wordProblemType}
            - **Variety and Creativity:** The scenario of the word problem must be creative, imaginative, engaging, and unique each time. Use storytelling elements. AVOID GENERIC "John has 5 apples" scenarios. Create relatable situations for children in Israel.
            - The SVG visualization should be a simple, charming illustration that represents the context of the problem. It should provide a visual clue but not solve the problem. For example, if the problem is about 3 children with 5 balloons each, show the 3 children, but not the total of 15 balloons.
            `;
            break;
    }

    return `
    ${baseInstructions}
    ${topicInstructions}

    SVG Visualization Rules:
    - Generate a single, valid SVG string. The SVG should be clean, clear, and pedagogically helpful.
    - Use friendly colors. Primary color for emphasis: #7371fc.
    - The SVG must be self-contained. The viewBox should be set appropriately.
    - Do not include an XML declaration.

    JSON Output Structure:
    Return a single, valid JSON object with this exact structure:
    {
      "problemText": "The math problem in Hebrew.",
      "visualizationSvg": "The SVG string for the visualization.",
      "answer": "The final correct answer as a string, following the specified format.",
      "explanation": "A step-by-step explanation of the solution in Hebrew, formatted with numbers and bolding.",
      "explanationHint": "The step-by-step explanation WITHOUT the final answer.",
      "operationType": "e.g., 'multiplication'"
    }
    `;
};

const validateExercise = (exercise: any): boolean => {
    if (!exercise || !exercise.problemText || !exercise.answer || !exercise.visualizationSvg || !exercise.explanation) {
        console.warn("Validation failed: AI response is missing required fields.", {
            missing: {
                problemText: !exercise.problemText,
                answer: !exercise.answer,
                visualizationSvg: !exercise.visualizationSvg,
                explanation: !exercise.explanation,
            }
        });
        return false;
    }
    
    // This regex catches invalid use of '?' as an operator, e.g., "2/5 ? 3/7".
    // It looks for a '?' that is preceded and followed by a digit or a slash, with optional whitespace.
    const invalidOperatorRegex = /[\d\/]\s*\?\s*[\d\/]/; 
    if (invalidOperatorRegex.test(exercise.problemText)) {
        console.warn("Validation failed: AI generated a problem with an invalid '?' operator.", exercise.problemText);
        return false;
    }

    return true;
};

export const generateExercise = async (topic: MathTopic, grade: Grade, operationType?: OperationType, lastOperationTypeToAvoid?: OperationType): Promise<MathExercise | null> => {
    const isFollowUp = !!operationType;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const prompt = getPromptForTopic(topic, grade, isFollowUp, operationType, lastOperationTypeToAvoid);

        try {
            const data = await callApi<{ text: string }>('generateExercise', {
                prompt,
                model: 'gemini-2.5-flash-preview-04-17',
                config: {
                    responseMimeType: 'application/json'
                }
            });

            const exerciseData = parseJsonResponse<{
                problemText: string;
                visualizationSvg: string;
                answer: string;
                explanation: string;
                explanationHint: string;
                operationType?: OperationType;
            }>(data.text);
            
            if (exerciseData && validateExercise(exerciseData)) {
                return {
                    problemText: exerciseData.problemText,
                    visualization: exerciseData.visualizationSvg,
                    answer: exerciseData.answer,
                    explanation: exerciseData.explanation,
                    explanationHint: exerciseData.explanationHint,
                    operationType: exerciseData.operationType,
                };
            } else {
                 if (attempt < maxRetries) {
                    console.log(`Attempt ${attempt} failed validation. Retrying...`);
                }
            }

        } catch (error) {
            console.error(`Error generating math exercise on attempt ${attempt}:`, error);
        }
    }
    
    console.error("Failed to generate a valid exercise after all retries.");
    return null;
};
