import { GoogleGenAI } from "@google/genai";
import type { Student, LinguisticAnswers, Grade, ComprehensionData, MathTopic, MathExercise, OperationType, Color } from '../types';

export const config = { runtime: "edge" };

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set.");
}
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- GENERAL HELPER FUNCTIONS ---
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

// --- LINGUISTIC HELPERS ---
const gradeToTextComplexityMap: Record<Grade, string> = {
    'ג': `
        - **Text Structure:** Single story or short informational text. Short paragraphs (3-5 sentences). One main title, no subtitles.
        - **Sentences & Connectivity:** Simple or compound sentences. Very few conjunctions (e.g., "and then", "but").
        - **Vocabulary & Knowledge:** Common, everyday words. No prior knowledge required.
        - **Conceptual Depth & Interpretation:** Direct and clear meaning. A simple educational or emotional message.`,
    'ד': `
        - **Text Structure:** Slightly longer paragraphs. May include a title and subheadings. Clear narrative or descriptive structure.
        - **Sentences & Connectivity:** Simple and some complex sentences. Initial use of varied conjunctions (e.g., "therefore", "also").
        - **Vocabulary & Knowledge:** Slightly less common words, including adjectives and simple concepts. General background knowledge is helpful but not required.
        - **Conceptual Depth & Interpretation:** One main meaning, with potential for deeper understanding. The message is clear but not always direct.`,
    'ה': `
        - **Text Structure:** Longer texts with paragraphs organized by ideas. Includes subheadings. Argumentative, comparative, or causal structure.
        - **Sentences & Connectivity:** More complex sentences with pronouns and links (e.g., "as a result", "in contrast").
        - **Vocabulary & Knowledge:** Abstract words, use of domain-specific concepts (e.g., scientific, civic). General understanding of the content area is needed.
        - **Conceptual Depth & Interpretation:** More than one layer of meaning exists. Understanding requires abstraction, generalization, or inference.`,
    'ו': `
        - **Text Structure:** Complex texts, sometimes combining different genres. Complex paragraphs with clear internal logic. Sophisticated structure with subheadings.
        - **Sentences & Connectivity:** Complex sentences with syntactic sub-structures. Wide and precise use of logical connections (e.g., "even though", "while").
        - **Vocabulary & Knowledge:** Technical, professional, and sometimes very abstract words. Prior mastery of complex topics is required.
        - **Conceptual Depth & Interpretation:** The message is not always explicit. Requires critical thinking, interpretation, and multi-step inference.`
};

const gradeToQuestionTypesMap: Record<Grade, string> = {
    'ג': "Following Bloom's Taxonomy, focus on the lower levels: **Remembering** (facts from the story), **Understanding** (explain ideas or concepts, e.g., cause-and-effect), and identifying character emotions.",
    'ד': "Following Bloom's Taxonomy, focus on **Remembering** and **Understanding** (sequence of events, character motivations) and introduce **Applying** (making connections, comparisons).",
    'ה': "Following Bloom's Taxonomy, focus on higher-order thinking: **Analyzing** (character analysis, motivations), **Evaluating** (judging the story's message), and **Creating** (proposing alternatives). Include inference questions.",
    'ו': "Following Bloom's Taxonomy, heavily focus on the highest levels: **Analyzing** (deep character analysis, complex themes), **Evaluating** (critical judgment of the message and character actions), and **Creating** (formulating new ideas based on the story). Questions should require multi-step inference and critical thinking."
};

const buildStoryPrompt = (student: Student, answers: LinguisticAnswers): string => {
    const { grade } = student;

    const rules = {
        wordCount: '60-140 words',
        subheadings: 'no subheadings',
        paragraphStyle: '4-7 sentences long'
    };

    if (grade === 'ה') {
        rules.wordCount = '150-250 words';
        rules.subheadings = 'exactly 2 subheadings, formatted as Markdown (e.g., "## שם תת-כותרת")';
        rules.paragraphStyle = '5-8 sentences long';
    } else if (grade === 'ו') {
        rules.wordCount = '200-300 words';
        rules.subheadings = '2 or 3 subheadings, formatted as Markdown (e.g., "## שם תת-כותרת")';
        rules.paragraphStyle = '5-8 sentences long';
    }

    const creativeGuideline = grade === 'ג' || grade === 'ד' ? `
    **Creative Guidelines (CRITICAL):**
    1.  **Thematic Inspiration, Not Literal Interpretation:** Your PRIMARY GOAL is a high-quality, coherent narrative. Use the student's preferences below as THEMATIC INSPIRATION ONLY. DO NOT force them into the plot literally. For example, if the student likes 'school', the theme could be about learning or friendship, but the story SHOULD NOT be set in a school unless it serves a high-quality narrative. Be creative.
    2.  **Avoid Clichés:** You MUST avoid simplistic "try and try again" or generic "believe in yourself" plots. The conflict and resolution must be specific and concrete. Instead of saying a character "tried hard," describe *how* they approached the specific, unique challenge they faced.
    3.  **Character:** Create a new, creative name for the main character (inspired by ${student.name}, but not the same). Decide the character's gender randomly and maintain consistency.` : `
    **Creative Guidelines (CRITICAL):**
    1.  **Deep Themes:** Use the student's preferences as a STARTING POINT to explore mature themes like personal growth, overcoming complex challenges, resilience, empathy, or understanding different perspectives.
    2.  **Meaningful Message:** The story must have a meaningful, non-childish message. Avoid simplistic plots.
    3.  **Relatable Character:** Create a new, creative name for the main character (inspired by ${student.name}). The character should be relatable and face a realistic, nuanced challenge. Decide the character's gender randomly.`;
    
    return `
    You are a creative and sophisticated storyteller for Israeli students. Your audience is a child in grade ${grade}. Your story must be in Hebrew.

    **Pedagogical and Structural Requirements (NON-NEGOTIABLE):**
    1.  **Text Complexity:** You MUST STRICTLY adhere to the following guidelines for grade ${grade}:
        ${gradeToTextComplexityMap[grade]}
    2.  **Story Length:** The entire story MUST be between ${rules.wordCount}.
    3.  **Structure:** The story must have ${rules.subheadings}.
    4.  **Paragraphs:** Paragraphs should be ${rules.paragraphStyle}.

    ${creativeGuideline}

    **Student Preferences for Thematic Inspiration:**
    - Story Genre: ${answers.storyType}
    - A recent achievement to inspire the theme: "${answers.achievement}"
    - A favorite place to set the scene: ${answers.favoritePlace}
    - A favorite character/role model for character traits: ${answers.roleModel}
    - Preferred colors for atmosphere: ${answers.colors.join(', ')}

    **Final Output Format:**
    Your response must be ONLY the story text in Hebrew. Do NOT include any introductory phrases, titles, or explanations. Start directly with the first word of the story.
    `;
};

const buildQuestionsPrompt = (story: string, grade: Grade): string => {
    return `
    Based on the provided Hebrew story, create comprehension questions for a student in grade ${grade}.
    Your response MUST be a single, valid JSON object.

    **Instructions:**
    1.  **Multiple Choice Questions (MCQs):**
        - Generate exactly 3 unique MCQs.
        - Each MCQ must have 4 options.
        - The pedagogical focus of the MCQs MUST follow these guidelines for grade ${grade}: ${gradeToQuestionTypesMap[grade]}.

    2.  **Open-Ended Questions:**
        - Generate exactly 2 unique, thought-provoking open-ended questions.
        - These questions MUST be based directly on the content and themes of the provided story.
        - The cognitive level of these questions MUST ALSO follow the same pedagogical guidelines for grade ${grade} from Bloom's Taxonomy: ${gradeToQuestionTypesMap[grade]}. For example, for grade 'ו', they should require analysis, evaluation, or creation based on the story's specific events or characters.

    **Output Format (JSON):**
    {
      "mcqs": [
        { "question": "...", "options": ["...", "...", "...", "..."], "correctAnswer": "..." }
      ],
      "openQuestions": ["...", "..."]
    }

    **The Story:**
    ---
    ${story}
    ---
    `;
};

const detectGender = async (studentName: string, userAnswers: string[]): Promise<'male' | 'female' | 'unknown'> => {
    const prompt = `
    Analyze the following Hebrew name and text to determine the likely gender of the writer.
    - Student's Name: "${studentName}"
    - Student's Answers: "${userAnswers.join(' ')}"
    
    Respond with ONLY one of the following words: "male", "female", or "unknown".
    Do not add any explanation. Base your analysis on common Hebrew names and grammatical gender in the answers.
    `;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: prompt
        });
        const gender = response.text.trim().toLowerCase();
        if (gender === 'male' || gender === 'female') {
            return gender;
        }
        return 'unknown';
    } catch (error) {
        console.error("Error detecting gender, defaulting to 'unknown':", error);
        return 'unknown';
    }
};

const buildImagePrompt = async (story: string, studentName: string, comprehensionAnswers: string[], colors: Color[]): Promise<string> => {
    const artStyles = ['digital painting', 'watercolor', 'comic book style', 'anime style', 'storybook illustration'];
    const randomStyle = artStyles[Math.floor(Math.random() * artStyles.length)];
    
    const detectedGender = await detectGender(studentName, comprehensionAnswers);
    let characterInstruction = "If the scene includes a person, make their gender ambiguous or gender-neutral. Or, show multiple characters of different genders.";
    if (detectedGender === 'male') {
        characterInstruction = "The main character in the scene should be a boy.";
    } else if (detectedGender === 'female') {
        characterInstruction = "The main character in the scene should be a girl.";
    }

    // The last two answers are the open-ended, personal ones.
    const firstOpenAnswer = comprehensionAnswers[comprehensionAnswers.length - 2] || "a positive moment from the story";
    const secondOpenAnswer = comprehensionAnswers[comprehensionAnswers.length - 1] || "a helpful action";

    return `
    **Primary Goal:** Create a beautiful and imaginative image in a child-friendly ${randomStyle}. The image must be deeply personalized based on the student's unique interpretation of a story.

    **Image Generation Methodology (Strictly Follow):**

    **1. Core Subject (70% of visual focus):** The absolute center of the image must be a visual representation of the student's personal connection to the story, derived from their answers to two dynamically generated reflective questions.
        - **Student's Reflections:** Visually synthesize the ideas from these two answers into one cohesive and imaginative scene. The answers are:
          1. "${firstOpenAnswer}"
          2. "${secondOpenAnswer}"
        - **Character Gender:** ${characterInstruction}
        This combined visual interpretation is the most important element of the image.

    **2. Supporting Background & Atmosphere (30% of visual focus):** The background should provide context and atmosphere, but MUST NOT overpower the core subject.
        - **Story Context:** Lightly base the environment on the original story's theme. The story was about: "${story.substring(0, 200)}...".
        - **Color Palette:** The overall color scheme should be heavily influenced by the student's favorite colors: ${colors.join(', ')}.
        - **Mood:** The mood must be joyful, magical, and celebratory of the student's learning achievement.

    **ABSOLUTE CRITICAL CONSTRAINT:** The image MUST NOT, under any circumstances, contain any text, letters, words, or written language of any kind. This is the most important rule. The output must be a purely visual illustration, free of all text.

    **Final Output Command:** Generate a single, high-quality image based on this weighted methodology.
    `;
};

// --- MATHEMATICAL HELPERS ---
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

// --- MAIN API HANDLER ---
export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { task, payload } = await req.json();

        // --- LINGUISTIC TASKS ---
        if (task === 'generateStory') {
            const { prompt, model, config } = payload as { 
                prompt: string, 
                model: string, 
                config?: { tools?: any[] } 
            };
            const response = await ai.models.generateContent({
                model: model || "gemini-2.5-flash-preview-04-17",
                contents: prompt,
                config: config || { tools: [{ googleSearch: {} }] }
            });
            return new Response(JSON.stringify({ text: response.text }), { headers: { 'Content-Type': 'application/json' } });
        }

        if (task === 'addNikud') {
            const { prompt, model } = payload as { prompt: string, model: string };
            const response = await ai.models.generateContent({ 
                model: model || "gemini-2.5-flash-preview-04-17", 
                contents: prompt 
            });
            return new Response(JSON.stringify({ text: response.text }), { headers: { 'Content-Type': 'application/json' } });
        }

        if (task === 'generateQuestions') {
            const { prompt, model, config } = payload as { 
                prompt: string, 
                model: string, 
                config: { responseMimeType: string } 
            };
            const response = await ai.models.generateContent({
                model: model || "gemini-2.5-flash-preview-04-17",
                contents: prompt,
                config: config || { responseMimeType: 'application/json' }
            });
            return new Response(JSON.stringify({ text: response.text }), { headers: { 'Content-Type': 'application/json' } });
        }

        if (task === 'detectGender') {
            const { prompt, model } = payload as { prompt: string, model: string };
            const response = await ai.models.generateContent({
                model: model || "gemini-2.5-flash-preview-04-17",
                contents: prompt
            });
            return new Response(JSON.stringify({ text: response.text }), { headers: { 'Content-Type': 'application/json' } });
        }

        if (task === 'generateImage') {
            const { prompt, model, config } = payload as {
                prompt: string;
                model: string;
                config: { numberOfImages: number; outputMimeType: string };
            };

            const response = await ai.models.generateImages({
                model: model || 'imagen-3.0-generate-002',
                prompt: prompt,
                config: config || { numberOfImages: 1, outputMimeType: 'image/jpeg' },
            });

            const imageBase64 = response.generatedImages && response.generatedImages.length > 0
                ? response.generatedImages[0].image.imageBytes
                : null;

            return new Response(JSON.stringify({ imageBase64 }), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // --- MATHEMATICAL TASKS ---
        if (task === 'generateExercise') {
            const { prompt, model, config } = payload as { 
                prompt: string; 
                model: string; 
                config: { responseMimeType: string } 
            };
            
            const response = await ai.models.generateContent({
                model: model,
                contents: prompt,
                config: config
            });

            const exerciseData = parseJsonResponse<{
                problemText: string;
                visualizationSvg: string;
                answer: string;
                explanation: string;
                explanationHint: string;
                operationType?: OperationType;
            }>(response.text);
            
            if (exerciseData && validateExercise(exerciseData)) {
                return new Response(JSON.stringify({ text: JSON.stringify(exerciseData) }), { 
                    headers: { 'Content-Type': 'application/json' } 
                });
            } else {
                throw new Error("Failed to generate a valid exercise.");
            }
        }

        return new Response(JSON.stringify({ error: 'Unknown task' }), { status: 400, headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('API Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
