
import { toast } from "@/components/ui/use-toast";
import { voiceParser } from "./VoiceParser";
import { voiceEvents } from "./VoiceEvents";
import { hotwordDetector } from "./HotwordDetector";
import { databaseService } from "@/services/DatabaseService";
import { categoryMatchingService } from "@/services/CategoryMatchingService";
import { CategoryMatch } from "./types";
import { ExpenseInput } from "@/models/Expense";

class VoiceRecognitionManager {
  private recognition: SpeechRecognition | null = null;
  private state = {
    isListening: false,
    pendingExpense: null as ExpenseInput | null
  };

  constructor() {
    this.setupRecognition();
  }

  private setupRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error("Speech recognition not supported");
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    
    if (this.recognition) {
      this.recognition.lang = 'es-ES';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 5;
      
      this.recognition.onresult = this.handleRecognitionResult.bind(this);
      this.recognition.onerror = this.handleRecognitionError.bind(this);
      this.recognition.onend = () => {
        this.state.isListening = false;
        console.log("Voice recognition ended");
        
        // Resume hotword detection
        hotwordDetector.resumeListening();
        
        if (this.state.pendingExpense === null && this.state.isListening) {
          toast({
            title: "No se detectó audio",
            description: "No pudimos escuchar lo que dijiste. Intenta de nuevo.",
            variant: "destructive",
          });
        }
      };
    }
  }

  private async handleRecognitionResult(event: SpeechRecognitionEvent) {
    const transcript = event.results[0][0].transcript.toLowerCase();
    console.log("Recognized speech:", transcript);
    
    // Log alternatives for debugging
    if (event.results[0].length > 1) {
      for (let i = 1; i < event.results[0].length; i++) {
        console.log(`Alternative ${i}:`, event.results[0][i].transcript.toLowerCase());
      }
    }
    
    try {
      const expenseData = await voiceParser.parseExpenseFromVoice(transcript);
      if (expenseData) {
        this.state.pendingExpense = expenseData;
        await this.handleExpenseData(expenseData);
      }
    } catch (error) {
      console.error("Error processing voice input:", error);
      toast({
        title: "Error",
        description: "Hubo un problema al procesar tu comando de voz.",
        variant: "destructive",
      });
    }
  }

  private async handleExpenseData(expenseData: ExpenseInput) {
    if (expenseData.categoryId && expenseData.categoryId !== "7") {
      await this.saveExpense(expenseData);
    } else {
      voiceEvents.dispatchAmbiguousCategoryEvent(
        this.state.pendingExpense,
        await this.findPossibleCategories(expenseData.description)
      );
    }
  }

  private handleRecognitionError(event: SpeechRecognitionErrorEvent) {
    console.error("Speech recognition error:", event.error);
    this.state.isListening = false;
    
    let errorMessage = "Error desconocido";
    switch (event.error) {
      case 'no-speech':
        errorMessage = "No se detectó ninguna voz";
        break;
      case 'aborted':
        errorMessage = "Reconocimiento cancelado";
        break;
      case 'audio-capture':
        errorMessage = "No se pudo acceder al micrófono";
        break;
      case 'network':
        errorMessage = "Error de red al procesar la voz";
        break;
      case 'not-allowed':
        errorMessage = "Permiso de micrófono denegado";
        break;
      case 'service-not-allowed':
        errorMessage = "Servicio de reconocimiento no disponible";
        break;
      case 'bad-grammar':
        errorMessage = "Problema con la gramática de reconocimiento";
        break;
      case 'language-not-supported':
        errorMessage = "Idioma no soportado";
        break;
    }
    
    toast({
      title: "Error en reconocimiento",
      description: errorMessage + ". Intenta nuevamente.",
      variant: "destructive",
    });
  }

  /**
   * Saves an expense to the database
   */
  public async saveExpense(expense: ExpenseInput): Promise<void> {
    try {
      await databaseService.addExpense(expense);
      this.state.pendingExpense = null;
      
      toast({
        title: "Gasto registrado",
        description: `${expense.amount} en ${expense.description}`,
      });
      
      voiceEvents.dispatchRecognitionComplete();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el gasto.",
        variant: "destructive",
      });
    }
  }
  
  /**
   * Finds possible categories for a description
   */
  public async findPossibleCategories(description: string): Promise<CategoryMatch[]> {
    try {
      const categories = await databaseService.getCategories();
      const matches = await categoryMatchingService.findMatchingCategories(description, categories);
      return matches.map(match => ({
        category: match.category,
        confidence: match.confidence
      }));
    } catch (error) {
      console.error("Error finding possible categories:", error);
      return [];
    }
  }
  
  /**
   * Confirms the selected category for a pending expense
   */
  public async confirmCategoryForPendingExpense(categoryId: string): Promise<void> {
    if (this.state.pendingExpense) {
      const updatedExpense = {
        ...this.state.pendingExpense,
        categoryId
      };
      
      await this.saveExpense(updatedExpense);
    } else {
      toast({
        title: "Error",
        description: "No hay un gasto pendiente para categorizar.",
        variant: "destructive",
      });
    }
  }

  public startExpenseRecognition(): void {
    if (!this.recognition) {
      this.setupRecognition();
    }

    try {
      this.state.pendingExpense = null;
      this.state.isListening = true;
      this.recognition?.start();
      console.log("Voice recognition started");
      
      toast({
        title: "Escuchando...",
        description: "Dime tu gasto. Por ejemplo: '1500 en comida'",
      });
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

  public stopListening(): void {
    if (this.recognition && this.state.isListening) {
      this.recognition.stop();
      this.state.isListening = false;
      console.log("Voice recognition stopped manually");
    }
  }

  get isListening(): boolean {
    return this.state.isListening;
  }
}

export const voiceRecognitionManager = new VoiceRecognitionManager();
