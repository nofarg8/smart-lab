import type { Student, LinguisticAnswers, ComprehensionData, Grade, Color } from '../types';

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

export const generateStory = async (student: Student, answers: LinguisticAnswers): Promise<string> => {
    const prompt = buildStoryPrompt(student, answers);
    try {
        const data = await callApi<{ text: string }>('generateStory', { 
            prompt,
            model: "gemini-2.5-flash-preview-04-17",
            config: {
                tools: [{ googleSearch: {} }],
            }
        });
        return data.text;
    } catch (error) {
        console.error("Error generating story:", error);
        return "מצטערת, הייתה בעיה ביצירת הסיפור. בואו ננסה שוב.";
    }
};

export const addNikud = async (text: string): Promise<string> => {
    const prompt = `Please add Hebrew vowel points (Nikud) to the following text. Return only the vocalized text.\n\n${text}`;
    try {
        const data = await callApi<{ text: string }>('addNikud', {
            prompt,
            model: "gemini-2.5-flash-preview-04-17"
        });
        return data.text;
    } catch (error) {
        console.error("Error adding nikud:", error);
        return text;
    }
};

export const generateQuestions = async (story: string, grade: Grade): Promise<ComprehensionData | null> => {
    const prompt = `
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

    try {
        const data = await callApi<{ text: string }>('generateQuestions', {
            prompt,
            model: "gemini-2.5-flash-preview-04-17",
            config: {
                responseMimeType: "application/json",
            }
        });
        
        return parseJsonResponse<ComprehensionData>(data.text);

    } catch (error) {
        console.error("Error generating questions:", error);
        return null;
    }
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
        const data = await callApi<{ text: string }>('detectGender', {
            prompt,
            model: "gemini-2.5-flash-preview-04-17"
        });
        const gender = data.text.trim().toLowerCase();
        if (gender === 'male' || gender === 'female') {
            return gender;
        }
        return 'unknown';
    } catch (error) {
        console.error("Error detecting gender, defaulting to 'unknown':", error);
        return 'unknown';
    }
};

export const generateImage = async (story: string, studentName: string, userAnswers: string[], colors: Color[]): Promise<string | null> => {
    const artStyles = ['digital painting', 'watercolor', 'comic book style', 'anime style', 'storybook illustration'];
    const randomStyle = artStyles[Math.floor(Math.random() * artStyles.length)];
    
    const detectedGender = await detectGender(studentName, userAnswers);
    let characterInstruction = "If the scene includes a person, make their gender ambiguous or gender-neutral. Or, show multiple characters of different genders.";
    if (detectedGender === 'male') {
        characterInstruction = "The main character in the scene should be a boy.";
    } else if (detectedGender === 'female') {
        characterInstruction = "The main character in the scene should be a girl.";
    }

    // The last two answers are the open-ended, personal ones.
    const firstOpenAnswer = userAnswers[userAnswers.length - 2] || "a positive moment from the story";
    const secondOpenAnswer = userAnswers[userAnswers.length - 1] || "a helpful action";

    const prompt = `
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

    try {
        const data = await callApi<{ imageBase64: string | null }>('generateImage', {
            prompt,
            model: 'imagen-3.0-generate-002',
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
            story,
            studentName,
            comprehensionAnswers: userAnswers,
            colors
        });
        return data.imageBase64;

    } catch (error) {
        console.error("Error generating image:", error);
        return null;
    }
};
