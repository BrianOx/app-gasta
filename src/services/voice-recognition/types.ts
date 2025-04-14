
import { Category } from "@/models/Category";
import { ExpenseInput } from "@/models/Expense";

export interface CategoryMatch {
  category: Category;
  confidence: number;
}

export interface VoiceRecognitionState {
  isListening: boolean;
  pendingExpense: ExpenseInput | null;
}
