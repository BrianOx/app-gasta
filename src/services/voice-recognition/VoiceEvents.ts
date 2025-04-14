
import { ExpenseInput } from "@/models/Expense";
import { CategoryMatch } from "./types";

class VoiceEvents {
  /**
   * Dispatches an event when voice recognition completes
   */
  public dispatchRecognitionComplete() {
    window.dispatchEvent(new CustomEvent('voiceRecognitionComplete'));
  }
  
  /**
   * Dispatches an event when an ambiguous category is detected
   */
  public dispatchAmbiguousCategoryEvent(pendingExpense: ExpenseInput, possibleMatches: CategoryMatch[]) {
    const event = new CustomEvent('voiceRecognitionAmbiguousCategory', {
      detail: {
        pendingExpense,
        possibleMatches
      }
    });
    
    window.dispatchEvent(event);
  }
}

export const voiceEvents = new VoiceEvents();
