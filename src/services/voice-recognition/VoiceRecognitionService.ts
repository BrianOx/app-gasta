
import { toast } from "@/components/ui/use-toast";
import { databaseService } from "../DatabaseService";
import { ExpenseInput } from "@/models/Expense";
import { categoryMatchingService } from "../CategoryMatchingService";
import { voiceParser } from "./VoiceParser";
import { voiceEvents } from "./VoiceEvents";
import { VoiceRecognitionState } from "./types";

class VoiceRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private state: VoiceRecognitionState = {
    isListening: false,
    pendingExpense: null
  };

  constructor() {
    this.setupRecognition();
  }

  private setupRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error("Speech recognition not supported in this browser");
      return;
    }

    // @ts-ignore - SpeechRecognition may not be in the TypeScript definitions
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    if (this.recognition) {
      this.recognition.lang = 'es-ES';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 3; // Obtener múltiples interpretaciones
      
      // Damos más tiempo antes de finalizar automáticamente
      if ('speechRecognitionTimeout' in this.recognition) {
        // @ts-ignore - Esta propiedad puede no estar en todos los navegadores
        this.recognition.speechRecognitionTimeout = 10000; // 10 segundos
      }

      this.recognition.onresult = this.handleRecognitionResult.bind(this);
      this.recognition.onerror = this.handleRecognitionError.bind(this);
      this.recognition.onend = () => {
        this.state.isListening = false;
        console.log("Voice recognition ended");
      };
    }
  }

  async startListening(): Promise<void> {
    if (!this.recognition) {
      this.setupRecognition();
      if (!this.recognition) {
        toast({
          title: "Error",
          description: "El reconocimiento de voz no está disponible en este navegador.",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      this.state.isListening = true;
      this.recognition.start();
      console.log("Voice recognition started");
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      this.state.isListening = false;
      toast({
        title: "Error",
        description: "No se pudo iniciar el reconocimiento de voz.",
        variant: "destructive",
      });
    }
  }

  stopListening(): void {
    if (this.recognition && this.state.isListening) {
      this.recognition.stop();
      this.state.isListening = false;
      console.log("Voice recognition stopped manually");
    }
  }

  private async handleRecognitionResult(event: SpeechRecognitionEvent) {
    const transcript = event.results[0][0].transcript.toLowerCase();
    console.log("Recognized speech:", transcript);
    
    // Registrar todas las alternativas para depuración
    if (event.results[0].length > 1) {
      for (let i = 1; i < event.results[0].length; i++) {
        console.log(`Alternative ${i}:`, event.results[0][i].transcript.toLowerCase());
      }
    }
    
    try {
      const expenseData = await voiceParser.parseExpenseFromVoice(transcript);
      if (expenseData) {
        this.state.pendingExpense = expenseData;
        
        // Check if we need to confirm category with user
        const categoryMatch = await categoryMatchingService.findBestCategoryMatch(expenseData.description);
        
        // If confidence is high enough, automatically assign category
        const CONFIDENCE_THRESHOLD = 0.6;
        
        if (categoryMatch.confidence >= CONFIDENCE_THRESHOLD || categoryMatch.possibleMatches.length <= 1) {
          // Confidence is high enough to assign automatically
          this.state.pendingExpense.categoryId = categoryMatch.categoryId;
          
          // Save expense
          await this.saveExpense(this.state.pendingExpense);
        } else {
          // Multiple possible matches with similar confidence
          console.log("Ambiguous category match:", categoryMatch);
          
          // Dispatch event with pending expense and possible categories
          voiceEvents.dispatchAmbiguousCategoryEvent(
            this.state.pendingExpense,
            categoryMatch.possibleMatches
          );
          
          // Note: expense will be saved after user selects category, not here
        }
      } else {
        toast({
          title: "No se pudo procesar",
          description: "No se reconoció un gasto válido. Intenta con otro formato.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing voice input:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu comando de voz.",
        variant: "destructive",
      });
    }
    
    // Notify that recognition is complete
    voiceEvents.dispatchRecognitionComplete();
  }

  // Save expense and notify user
  public async saveExpense(expense: ExpenseInput): Promise<void> {
    await databaseService.addExpense(expense);
    const category = await databaseService.getCategoryById(expense.categoryId);
    toast({
      title: "Gasto registrado",
      description: `Se agregó ${expense.amount} por "${expense.description}" en ${
        category?.name || "categoría"
      }`,
    });
    
    // Reset pending expense
    this.state.pendingExpense = null;
    
    // Dispatch event to reload data
    voiceEvents.dispatchRecognitionComplete();
  }
  
  // Method to complete expense with selected category
  public async confirmCategoryForPendingExpense(categoryId: string): Promise<boolean> {
    if (!this.state.pendingExpense) {
      return false;
    }
    
    this.state.pendingExpense.categoryId = categoryId;
    await this.saveExpense(this.state.pendingExpense);
    return true;
  }

  private handleRecognitionError(event: SpeechRecognitionErrorEvent) {
    console.error("Speech recognition error:", event.error);
    this.state.isListening = false;
    
    toast({
      title: "Error en reconocimiento",
      description: `Error: ${event.error}. Intenta nuevamente.`,
      variant: "destructive",
    });
  }

  isRecognitionSupported(): boolean {
    return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  }
  
  get isListening(): boolean {
    return this.state.isListening;
  }
}

// Create singleton instance
export const voiceRecognitionService = new VoiceRecognitionService();
