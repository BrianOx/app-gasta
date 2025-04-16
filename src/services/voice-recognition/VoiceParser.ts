
import { ExpenseInput } from "@/models/Expense";
import { aiVoiceProcessor } from "./AIVoiceProcessor";

class VoiceParser {
  /**
   * Parse spoken text to extract expense information
   * Utiliza el procesador de IA para mejor comprensión
   */
  public async parseExpenseFromVoice(transcript: string): Promise<ExpenseInput | null> {
    console.log("Parsing expense from:", transcript);
    
    // Utilizamos el procesador de IA para analizar el comando
    const { expense, confidence } = await aiVoiceProcessor.processVoiceCommand(transcript);
    
    // Si el procesador de IA encontró un gasto válido, lo devolvemos
    if (expense && expense.amount > 0) {
      console.log("AI detected expense:", expense, "with confidence:", confidence);
      return expense;
    }
    
    // Fallback al método original si la IA no encontró un gasto válido
    return this.fallbackParsing(transcript);
  }
  
  /**
   * Método de respaldo que utiliza la lógica original
   */
  private fallbackParsing(transcript: string): ExpenseInput | null {
    // Patrones para extracción de datos
    const amountPattern = /(\d+(?:[.,]\d+)?)/;
    
    // Patrones para descripción
    const descriptionPatterns = [
      /(?:en|por|de)\s+([a-zÀ-ú\s]+?)(?:,|\sen\s|$|\scategoría\s|\spara\s|\s\d)/i,
      /(?:gast[éoe]|compr[éoe])\s+(?:en|por)?\s+([a-zÀ-ú\s]+?)(?:,|\sen\s|$|\scategoría\s|\spara\s|\s\d)/i,
      /\d+(?:[.,]\d+)?\s+(?:pesos|€|euros|dólares|dollars)?\s+(?:en|de|por)?\s+([a-zÀ-ú\s]+?)(?:,|\sen\s|$|\scategoría\s|\spara\s|\s\d)/i,
      /(?:por|en|de)\s+([a-zÀ-ú\s]+)$/i
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
    
    // Mostrar lo que encontramos para depuración
    console.log("Fallback Amount match:", amountMatch?.[1]);
    console.log("Fallback Description match:", descriptionMatch?.[1]);
  
    if (!amountMatch) {
      console.log("Could not extract amount from:", transcript);
      return null;
    }
  
    // Procesar el monto
    const amount = parseFloat(amountMatch[1].replace(',', '.'));
  
    // Procesar la descripción
    let description = "Gasto sin descripción";
    if (descriptionMatch && descriptionMatch[1]) {
      description = descriptionMatch[1].trim();
    } else {
      // Si no tenemos descripción, intentemos usar el resto del texto después del monto
      const textAfterAmount = transcript.substring(transcript.indexOf(amountMatch[0]) + amountMatch[0].length);
      if (textAfterAmount && textAfterAmount.trim().length > 3) {
        description = textAfterAmount.trim();
      }
    }
  
    // Categoría por defecto
    let categoryId = "7"; // Default a "Otros"
  
    return {
      amount,
      description,
      categoryId,
      date: new Date(),
    };
  }
}

export const voiceParser = new VoiceParser();
