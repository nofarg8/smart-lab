
export type Grade = 'ג' | 'ד' | 'ה' | 'ו';

export interface Student {
  name: string;
  grade: Grade;
}

export type StoryType = 'הרפתקאות' | 'חיות' | 'מצחיק' | 'קסם' | 'משפחה';
export type FavoritePlace = 'בית' | 'טבע' | 'בית ספר' | 'ספורט' | 'יצירה';
export type Color = 'כחול' | 'אדום' | 'ירוק' | 'צהוב' | 'סגול' | 'כתום' | 'ורוד' | 'כולם';

export interface LinguisticAnswers {
  storyType: StoryType;
  achievement: string;
  favoritePlace: FavoritePlace;
  roleModel: string;
  colors: Color[];
}

export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface ComprehensionData {
  mcqs: MCQ[];
  openQuestions: string[];
}

export type MathTopic = '4_operations' | 'fractions' | 'average' | 'word_problems';
export type OperationType = 'addition' | 'subtraction' | 'multiplication' | 'division';

export interface MathExercise {
    problemText: string;
    visualization: string; // base64 image string
    answer: string;
    explanation: string;
    explanationHint?: string;
    operationType?: OperationType;
}
