
import { ExpenseInput } from "@/models/Expense";

class VoiceParser {
  /**
   * Parse spoken text to extract expense information
   */
  public parseExpenseFromVoice(transcript: string): ExpenseInput | null {
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
}

export const voiceParser = new VoiceParser();
