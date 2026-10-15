import type { AnswerState } from "@/components/AnswerOption";
import type { Question } from "@/lib/questions/schema";

/** Det som behövs för att visa och rätta en fråga. */
export type PracticeQuestion = Pick<
  Question,
  "id" | "chapter" | "section" | "question" | "options" | "correct_index" | "explanation" | "source_reference"
>;

export type AnswerResult = { questionId: string; selected: number; isCorrect: boolean };

/** RÄTTNING: jämför valt alternativ med rätt svar. */
export function gradeAnswer(question: Pick<PracticeQuestion, "options" | "correct_index">, selected: number): boolean {
  if (!Number.isInteger(selected) || selected < 0 || selected >= question.options.length) {
    throw new Error(`Ogiltigt svar: ${selected}`);
  }
  return selected === question.correct_index;
}

/**
 * Vilken färg ett alternativ ska ha.
 * Före svar: neutralt. Efter svar: rätt svar alltid grönt, ett felaktigt val rött, övriga nedtonade.
 */
export function optionState(optionIndex: number, selected: number | null, correctIndex: number): AnswerState {
  if (selected === null) return "idle";
  if (optionIndex === correctIndex) return "correct";
  if (optionIndex === selected) return "wrong";
  return "dimmed";
}

export type SessionState = {
  questions: PracticeQuestion[];
  index: number;
  /** Valt alternativ för aktuell fråga, null om inte besvarad än. */
  selected: number | null;
  results: AnswerResult[];
  finished: boolean;
};

export type SessionAction =
  | { type: "answer"; selected: number }
  | { type: "next" }
  | { type: "restart"; questions: PracticeQuestion[] };

export function initSession(questions: PracticeQuestion[]): SessionState {
  return { questions, index: 0, selected: null, results: [], finished: questions.length === 0 };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "answer": {
      // Man kan bara svara en gång per fråga.
      if (state.finished || state.selected !== null) return state;
      const question = state.questions[state.index];
      const isCorrect = gradeAnswer(question, action.selected);
      return {
        ...state,
        selected: action.selected,
        results: [...state.results, { questionId: question.id, selected: action.selected, isCorrect }],
      };
    }
    case "next": {
      if (state.selected === null) return state; // måste svara först
      const nextIndex = state.index + 1;
      if (nextIndex >= state.questions.length) return { ...state, finished: true };
      return { ...state, index: nextIndex, selected: null };
    }
    case "restart":
      return initSession(action.questions);
  }
}

export function summarize(results: AnswerResult[]) {
  const correct = results.filter((r) => r.isCorrect).length;
  return { correct, total: results.length, share: results.length ? correct / results.length : 0 };
}

/** Blandar en lista (Fisher–Yates). Ger en ny lista, ändrar inte originalet. */
export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
