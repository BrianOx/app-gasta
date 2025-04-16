
import { ExpenseInput } from "@/models/Expense";
import { categoryMatchingService } from "../CategoryMatchingService";
import { toast } from "@/components/ui/use-toast";

/**
 * Servicio de IA para procesar y extraer información de comandos de voz
 * Utiliza técnicas de NLP para una mejor comprensión del lenguaje natural
 */
class AIVoiceProcessor {
  // Contexto de comandos previos para mejorar reconocimiento
  private contextHistory: string[] = [];
  private readonly MAX_CONTEXT_LENGTH = 5;

  /**
   * Procesa un comando de voz utilizando técnicas de NLP
   */
  public async processVoiceCommand(transcript: string): Promise<{
    expense: ExpenseInput | null;
    confidence: number;
    possibleCategories?: string[];
  }> {
    console.log("AI procesando comando:", transcript);
    
    try {
      // Normalizar y limpiar el texto
      const normalizedText = this.normalizeText(transcript);
      
      // Actualizar contexto histórico
      this.updateContext(normalizedText);
      
      // Extraer entidades (monto, descripción)
      const entities = this.extractEntities(normalizedText);
      
      if (!entities.amount) {
        console.log("AI no detectó un monto en el comando");
        return { expense: null, confidence: 0 };
      }
      
      // Mejorar la descripción
      const enhancedDescription = this.enhanceDescription(entities.description || "");
      
      // Aplicar aprendizaje de patrones conocidos
      const enhancedEntities = this.applyPatternLearning(entities);
      
      // Encontrar la categoría más probable
      const categoryMatch = await categoryMatchingService.findBestCategoryMatch(
        enhancedEntities.description || enhancedDescription
      );
      
      // Construir el objeto de gasto
      const expense: ExpenseInput = {
        amount: enhancedEntities.amount,
        description: enhancedEntities.description || enhancedDescription || "Gasto por voz",
        categoryId: categoryMatch.categoryId,
        date: new Date(),
      };
      
      console.log("AI resultados:", {
        expense,
        confidence: categoryMatch.confidence,
        possibleCategories: categoryMatch.possibleMatches.map(m => m.category.name)
      });
      
      return {
        expense,
        confidence: categoryMatch.confidence,
        possibleCategories: categoryMatch.possibleMatches.map(m => m.category.name)
      };
    } catch (error) {
      console.error("Error en el procesamiento AI de voz:", error);
      toast({
        title: "Error de procesamiento",
        description: "No se pudo procesar el comando de voz correctamente",
        variant: "destructive",
      });
      return { expense: null, confidence: 0 };
    }
  }
  
  /**
   * Actualiza el contexto histórico de comandos
   */
  private updateContext(text: string): void {
    this.contextHistory.push(text);
    if (this.contextHistory.length > this.MAX_CONTEXT_LENGTH) {
      this.contextHistory.shift(); // Mantener solo los últimos N comandos
    }
  }
  
  /**
   * Extrae entidades (monto, descripción) del texto usando patrones avanzados
   */
  private extractEntities(text: string): { amount: number | null; description: string | null } {
    // Patrones mejorados para reconocimiento
    const patterns = {
      // Patrones para monto (más flexibles y robustos)
      amount: [
        /(\d+(?:[.,]\d+)?)\s*(?:pesos|euros|dólares|€|\$)?/i,
        /(?:gast[eéoa]|pag[ueéoa]|compr[eéoa]|adquir[ií])\s+(?:por)?\s*(\d+(?:[.,]\d+)?)/i,
        /(?:son|fueron|es|de)\s+(\d+(?:[.,]\d+)?)\s*(?:pesos|euros|dólares|€|\$)?/i
      ],
      
      // Patrones para descripción (más contextuales)
      description: [
        /(?:en|por|de|para)\s+([a-zÀ-ú\s]+?)(?:,|\sen\s|\sde\s|$|\scategoría\s|\spara\s|\s\d)/i,
        /(?:gast[eéoa]|pag[ueéoa]|compr[eéoa])\s+(?:en|por)?\s+([a-zÀ-ú\s]+?)(?:,|\sen\s|$|\scategoría\s|\spara\s|\s\d)/i,
        /\d+(?:[.,]\d+)?\s+(?:pesos|€|euros|dólares|dollars)?\s+(?:en|de|por)?\s+([a-zÀ-ú\s]+?)(?:,|\sen\s|$|\scategoría\s|\spara\s|\s\d)/i,
        /(?:por|en|de)\s+([a-zÀ-ú\s]+)$/i
      ]
    };
    
    // Buscar monto
    let amountMatch = null;
    for (const pattern of patterns.amount) {
      const match = text.match(pattern);
      if (match && match[1]) {
        amountMatch = match[1].replace(',', '.');
        break;
      }
    }
    
    // Buscar descripción
    let descriptionMatch = null;
    for (const pattern of patterns.description) {
      const match = text.match(pattern);
      if (match && match[1]) {
        descriptionMatch = match[1].trim();
        break;
      }
    }
    
    // Si no tenemos descripción pero hay texto después del monto
    if (!descriptionMatch && amountMatch) {
      const textAfterAmount = text.substring(text.indexOf(amountMatch) + amountMatch.length);
      if (textAfterAmount && textAfterAmount.trim().length > 3) {
        descriptionMatch = textAfterAmount.trim();
      }
    }
    
    return {
      amount: amountMatch ? parseFloat(amountMatch) : null,
      description: descriptionMatch
    };
  }
  
  /**
   * Mejora la descripción basándose en palabras clave específicas
   */
  private enhanceDescription(description: string): string {
    if (!description) return "Gasto por voz";
    
    // Lista de prefijos comunes que no aportan valor semántico
    const prefixesToRemove = [
      "en ", "por ", "para ", "de ", "del ", "la ", "el ", "los ", "las ", "un ", "una "
    ];
    
    let enhanced = description.toLowerCase();
    // Eliminar prefijos al inicio de la descripción
    for (const prefix of prefixesToRemove) {
      if (enhanced.startsWith(prefix)) {
        enhanced = enhanced.substring(prefix.length);
        break;
      }
    }
    
    // Capitalizar primera letra
    enhanced = enhanced.charAt(0).toUpperCase() + enhanced.slice(1);
    
    return enhanced;
  }
  
  /**
   * Aplica aprendizaje de patrones conocidos
   */
  private applyPatternLearning(entities: { amount: number | null; description: string | null }): { 
    amount: number; 
    description: string | null 
  } {
    // Correcciones comunes basadas en patrones observados
    const knownPatterns: {
      pattern: RegExp;
      handler: (text: string, amount: number | null) => { amount: number; description: string | null };
    }[] = [
      // Patrones específicos para restaurantes
      {
        pattern: /(?:restaurant|restaurante|resto|caf[eé]|bar|pizzer[ií]a)/i,
        handler: (text, amount) => ({
          amount: amount || 0,
          description: text.match(/(?:restaurant|restaurante|resto|caf[eé]|bar|pizzer[ií]a)\s+([a-zÀ-ú\s]+)/i)?.[1] || 
                    "Restaurante"
        })
      },
      // Patrones para comida rápida
      {
        pattern: /(?:burger|hamburguesa|pizza|sushi|taco|kebab)/i,
        handler: (text, amount) => ({
          amount: amount || 0,
          description: text.includes("delivery") || text.includes("envío") ? 
                    "Delivery de comida" : "Comida rápida"
        })
      }
    ];
    
    // Si no hay un monto válido, establecer un valor por defecto
    const safeAmount = entities.amount || 0;
    
    // Texto completo para análisis de patrones
    const contextText = [
      ...this.contextHistory.slice(-2), 
      entities.description || ""
    ].join(" ");
    
    // Aplicar patrones conocidos
    for (const { pattern, handler } of knownPatterns) {
      if (pattern.test(contextText)) {
        return handler(contextText, safeAmount);
      }
    }
    
    return {
      amount: safeAmount,
      description: entities.description
    };
  }
  
  /**
   * Normaliza el texto para procesamiento
   */
  private normalizeText(text: string): string {
    return text.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Eliminar acentos
  }
}

export const aiVoiceProcessor = new AIVoiceProcessor();
