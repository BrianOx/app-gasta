
import { toast } from "@/components/ui/use-toast";
import { databaseService } from "./DatabaseService";
import { ExpenseInput } from "@/models/Expense";
import { categoryMatchingService } from "./CategoryMatchingService";

class VoiceRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;
  // New property to track if we're waiting for category selection
  private pendingExpense: ExpenseInput | null = null;
  // New event for ambiguous category detection
  private ambiguousCategoryEvent = new CustomEvent('voiceRecognitionAmbiguousCategory', {
    detail: { pendingExpense: null, possibleCategories: [] }
  });

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
        this.isListening = false;
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
      this.isListening = true;
      this.recognition.start();
      console.log("Voice recognition started");
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      this.isListening = false;
      toast({
        title: "Error",
        description: "No se pudo iniciar el reconocimiento de voz.",
        variant: "destructive",
      });
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
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
      const expenseData = await this.parseExpenseFromVoice(transcript);
      if (expenseData) {
        this.pendingExpense = expenseData;
        
        // Check if we need to confirm category with user
        const categoryMatch = await categoryMatchingService.findBestCategoryMatch(expenseData.description);
        
        // If confidence is high enough, automatically assign category
        const CONFIDENCE_THRESHOLD = 0.6;
        
        if (categoryMatch.confidence >= CONFIDENCE_THRESHOLD || categoryMatch.possibleMatches.length <= 1) {
          // Confidence is high enough to assign automatically
          this.pendingExpense.categoryId = categoryMatch.categoryId;
          
          // Save expense
          await this.saveExpense(this.pendingExpense);
        } else {
          // Multiple possible matches with similar confidence
          console.log("Ambiguous category match:", categoryMatch);
          // Create event with pending expense and possible categories
          const ambiguousEvent = new CustomEvent('voiceRecognitionAmbiguousCategory', {
            detail: {
              pendingExpense: this.pendingExpense,
              possibleMatches: categoryMatch.possibleMatches
            }
          });
          
          // Dispatch event to be handled by UI
          window.dispatchEvent(ambiguousEvent);
          
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
    this.pendingExpense = null;
    
    // Dispatch event to reload data
    window.dispatchEvent(new CustomEvent('voiceRecognitionComplete'));
  }
  
  // Method to complete expense with selected category
  public async confirmCategoryForPendingExpense(categoryId: string): Promise<boolean> {
    if (!this.pendingExpense) {
      return false;
    }
    
    this.pendingExpense.categoryId = categoryId;
    await this.saveExpense(this.pendingExpense);
    return true;
  }

  private handleRecognitionError(event: SpeechRecognitionErrorEvent) {
    console.error("Speech recognition error:", event.error);
    this.isListening = false;
    
    toast({
      title: "Error en reconocimiento",
      description: `Error: ${event.error}. Intenta nuevamente.`,
      variant: "destructive",
    });
  }

  private async parseExpenseFromVoice(transcript: string): Promise<ExpenseInput | null> {
    console.log("Parsing expense from:", transcript);
    
    // Patrones mejorados para extraer datos del comando de voz
    const amountPattern = /(\d+(?:[.,]\d+)?)/;
    
    // Ampliamos patrones para descripción para capturar diferentes formas de hablar
    const descriptionPatterns = [
      /(?:en|por|de)\s+([a-zÀ-ú\s]+?)(?:,|\sen\s|$|\scategoría\s|\spara\s)/i,
      /(?:gast[éoe]|compr[éoe])\s+(?:en|por)?\s+([a-zÀ-ú\s]+?)(?:,|\sen\s|$|\scategoría\s|\spara\s)/i,
      /\d+(?:[.,]\d+)?\s+(?:pesos|€|euros|dólares|dollars)?\s+(?:en|de|por)?\s+([a-zÀ-ú\s]+?)(?:,|\sen\s|$|\scategoría\s|\spara\s)/i
    ];
    
    // Ampliamos patrones para categoría
    const categoryPatterns = [
      /(?:categoría|categoria)\s+([a-zÀ-ú\s]+)(?:,|\.|\s|$)/i,
      /(?:en la categoría|para la categoría|en categoría)\s+([a-zÀ-ú\s]+)(?:,|\.|\s|$)/i,
      /(?:en|para)\s+([a-zÀ-ú\s]+)$/i
    ];
  
    // Extracción de datos
    const amountMatch = transcript.match(amountPattern);
    
    // Intentar extraer descripción con múltiples patrones
    let descriptionMatch = null;
    for (const pattern of descriptionPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        descriptionMatch = match;
        break;
      }
    }
    
    // Intentar extraer categoría con múltiples patrones
    let categoryMatch = null;
    for (const pattern of categoryPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        categoryMatch = match;
        break;
      }
    }
    
    // Mostrar lo que encontramos para depuración
    console.log("Amount match:", amountMatch?.[1]);
    console.log("Description match:", descriptionMatch?.[1]);
    console.log("Category match:", categoryMatch?.[1]);
  
    if (!amountMatch) {
      console.log("Could not extract amount from:", transcript);
      return null;
    }
  
    // Procesar el monto
    const amount = parseFloat(amountMatch[1].replace(',', '.'));
  
    // Procesar la descripción
    const description = descriptionMatch 
      ? descriptionMatch[1].trim() 
      : "Gasto sin descripción";
  
    // Procesar la categoría - no la buscamos todavía, lo haremos con el sistema de coincidencia
    let categoryId = "7"; // Default a "Otros"
  
    return {
      amount,
      description,
      categoryId,
      date: new Date(),
    };
  }

  isRecognitionSupported(): boolean {
    return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  }
}

export const voiceRecognitionService = new VoiceRecognitionService();
