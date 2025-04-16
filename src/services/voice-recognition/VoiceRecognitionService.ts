
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
      this.recognition.maxAlternatives = 5; // Obtener más interpretaciones
      
      // Damos más tiempo antes de finalizar automáticamente
      if ('speechRecognitionTimeout' in this.recognition) {
        // @ts-ignore - Esta propiedad puede no estar en todos los navegadores
        this.recognition.speechRecognitionTimeout = 15000; // 15 segundos
      }

      this.recognition.onresult = this.handleRecognitionResult.bind(this);
      this.recognition.onerror = this.handleRecognitionError.bind(this);
      this.recognition.onend = () => {
        this.state.isListening = false;
        console.log("Voice recognition ended");
        
        // Solo mostramos la notificación de error si no se procesó ningún resultado
        // y además no se canceló manualmente
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
      // Limpiar estado anterior
      this.state.pendingExpense = null;
      this.state.isListening = true;
      this.recognition.start();
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
    
    // Registrar todas las alternativas para depuración y mejora de IA
    if (event.results[0].length > 1) {
      for (let i = 1; i < event.results[0].length; i++) {
        console.log(`Alternative ${i}:`, event.results[0][i].transcript.toLowerCase());
      }
    }
    
    try {
      const expenseData = await voiceParser.parseExpenseFromVoice(transcript);
      if (expenseData) {
        this.state.pendingExpense = expenseData;
        
        // Si ya tenemos una categoría asignada por la IA
        if (expenseData.categoryId && expenseData.categoryId !== "7") {
          // Guardar gasto directamente si la IA ya asignó una categoría con alta confianza
          await this.saveExpense(this.state.pendingExpense);
        } else {
          // Si no, usar el sistema de coincidencia para encontrar la mejor categoría
          const categoryMatch = await categoryMatchingService.findBestCategoryMatch(expenseData.description);
          
          // Si la confianza es suficiente, asignar automáticamente
          const CONFIDENCE_THRESHOLD = 0.5;
          
          if (categoryMatch.confidence >= CONFIDENCE_THRESHOLD || categoryMatch.possibleMatches.length <= 1) {
            // La confianza es suficiente para asignar automáticamente
            this.state.pendingExpense.categoryId = categoryMatch.categoryId;
            
            // Guardar gasto
            await this.saveExpense(this.state.pendingExpense);
          } else {
            // Múltiples coincidencias posibles con confianza similar
            console.log("Ambiguous category match:", categoryMatch);
            
            // Enviar evento con gasto pendiente y categorías posibles
            voiceEvents.dispatchAmbiguousCategoryEvent(
              this.state.pendingExpense,
              categoryMatch.possibleMatches
            );
          }
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
    
    // Notificar que el reconocimiento está completo
    voiceEvents.dispatchRecognitionComplete();
  }

  // Save expense and notify user
  public async saveExpense(expense: ExpenseInput): Promise<void> {
    await databaseService.addExpense(expense);
    const category = await databaseService.getCategoryById(expense.categoryId);
    toast({
      title: "Gasto registrado",
      description: `Se agregó ${expense.amount} por "${expense.description}" en ${
        category?.name || "categoría desconocida"
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

  isRecognitionSupported(): boolean {
    return ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
  }
  
  get isListening(): boolean {
    return this.state.isListening;
  }
}

// Create singleton instance
export const voiceRecognitionService = new VoiceRecognitionService();
