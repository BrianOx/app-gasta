
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
        await databaseService.addExpense(expenseData);
        const category = await databaseService.getCategoryById(expenseData.categoryId);
        toast({
          title: "Gasto registrado",
          description: `Se agregó ${expenseData.amount} por "${expenseData.description}" en ${
            category?.name || "categoría"
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
  
    // Procesar la categoría - Hacemos esto asíncrono para mayor precisión
    let categoryId = "7"; // Default a "Otros"
    
    if (categoryMatch) {
      // Buscar la categoría por nombre con mayor flexibilidad
      const categoryNameInput = categoryMatch[1].trim().toLowerCase();
      const categories = await databaseService.getCategories();
      
      // Primero buscamos coincidencia exacta
      let matchedCategory = categories.find(
        c => c.name.toLowerCase() === categoryNameInput
      );
      
      // Si no hay coincidencia exacta, buscamos coincidencia parcial
      if (!matchedCategory) {
        matchedCategory = categories.find(
          c => c.name.toLowerCase().includes(categoryNameInput) || 
               categoryNameInput.includes(c.name.toLowerCase())
        );
      }
      
      if (matchedCategory) {
        categoryId = matchedCategory.id;
        console.log("Matched to category:", matchedCategory.name);
      } else {
        console.log("No category match found for:", categoryNameInput);
      }
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
