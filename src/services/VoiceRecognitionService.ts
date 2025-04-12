
import { toast } from "@/components/ui/use-toast";
import { databaseService } from "./DatabaseService";
import { ExpenseInput } from "@/models/Expense";

class VoiceRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening: boolean = false;

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

      this.recognition.onresult = this.handleRecognitionResult.bind(this);
      this.recognition.onerror = this.handleRecognitionError.bind(this);
      this.recognition.onend = () => {
        this.isListening = false;
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
    }
  }

  private async handleRecognitionResult(event: SpeechRecognitionEvent) {
    const transcript = event.results[0][0].transcript.toLowerCase();
    console.log("Recognized speech:", transcript);
    
    try {
      const expenseData = this.parseExpenseFromVoice(transcript);
      if (expenseData) {
        await databaseService.addExpense(expenseData);
        toast({
          title: "Gasto registrado",
          description: `Se agregó ${expenseData.amount} por ${expenseData.description} en ${
            (await databaseService.getCategoryById(expenseData.categoryId))?.name || "categoría"
          }`,
        });
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

  private handleRecognitionError(event: SpeechRecognitionErrorEvent) {
    console.error("Speech recognition error:", event.error);
    this.isListening = false;
    
    toast({
      title: "Error en reconocimiento",
      description: `Error: ${event.error}. Intenta nuevamente.`,
      variant: "destructive",
    });
  }

  private parseExpenseFromVoice(transcript: string): ExpenseInput | null {
    // Patrones para extraer datos del comando de voz
    const amountPattern = /(\d+(?:[.,]\d+)?)/;
    const descriptionPattern = /(?:en|por)\s+([a-zÀ-ú\s]+?)(?:,|\sen\s|$|\scategoría\s)/i;
    const categoryPattern = /(?:categoría|categoria)\s+([a-zÀ-ú\s]+)(?:,|\.|\s|$)/i;
  
    // Extracción de datos
    const amountMatch = transcript.match(amountPattern);
    const descriptionMatch = transcript.match(descriptionPattern);
    const categoryMatch = transcript.match(categoryPattern);
  
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
  
    // Procesar la categoría
    let categoryId = "7"; // Default to "Otros"
    if (categoryMatch) {
      // Buscar la categoría por nombre
      const categoryName = categoryMatch[1].trim().toLowerCase();
      databaseService.getCategories()
        .then(categories => {
          const category = categories.find(
            c => c.name.toLowerCase() === categoryName
          );
          if (category) {
            categoryId = category.id;
          }
        })
        .catch(error => {
          console.error("Error getting categories:", error);
        });
    }
  
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
