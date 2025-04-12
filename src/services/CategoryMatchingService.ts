
import { Category } from "@/models/Category";
import { databaseService } from "./DatabaseService";

// Interface for category synonym mapping
interface CategorySynonyms {
  categoryId: string;
  synonyms: string[];
}

// Default synonyms for built-in categories
const DEFAULT_CATEGORY_SYNONYMS: CategorySynonyms[] = [
  {
    categoryId: "1", // Comida
    synonyms: ["comida", "alimentos", "restaurante", "desayuno", "almuerzo", "cena", 
               "pizza", "hamburguesa", "sushi", "café", "cafetería", "bar", "helado",
               "merienda", "postre", "comedor", "comer", "almorzar", "cenar", "desayunar"]
  },
  {
    categoryId: "2", // Transporte
    synonyms: ["transporte", "taxi", "colectivo", "subte", "bus", "gasolina", "combustible", 
               "nafta", "tren", "pasaje", "viaje", "uber", "cabify", "remis", "peaje", 
               "estacionamiento", "auto", "moto", "bicicleta", "monopatin"]
  },
  {
    categoryId: "3", // Compras
    synonyms: ["compras", "tienda", "ropa", "calzado", "zapatos", "camisa", "pantalón", 
               "vestido", "accesorios", "reloj", "gafas", "lentes", "tecnología", "electrodomésticos", 
               "muebles", "decoración", "casa", "hogar", "supermercado", "super", "abarrotes", "mercado"]
  },
  {
    categoryId: "4", // Entretenimiento
    synonyms: ["entretenimiento", "cine", "teatro", "concierto", "evento", "boleto", "entrada", 
               "espectáculo", "juego", "videojuego", "música", "streaming", "netflix", "spotify", 
               "disney", "amazon", "fiesta", "salida", "paseo", "hobby", "deporte"]
  },
  {
    categoryId: "5", // Salud
    synonyms: ["salud", "médico", "doctor", "hospital", "clínica", "consulta", "medicamento", 
               "farmacia", "remedio", "pastillas", "tratamiento", "terapia", "psicólogo", 
               "dentista", "odontología", "seguro", "vitaminas", "suplementos"]
  },
  {
    categoryId: "6", // Facturas
    synonyms: ["facturas", "servicios", "luz", "electricidad", "agua", "gas", "internet", 
               "teléfono", "celular", "cable", "televisión", "alquiler", "renta", "hipoteca", 
               "impuestos", "cuota", "mensualidad", "suscripción", "membresía", "pago"]
  },
  {
    categoryId: "7", // Otros
    synonyms: ["otros", "varios", "misceláneos", "diverso", "general", "adicional", "extra"]
  },
  // User can add more through the app
];

// Custom category synonyms added by the user
let customCategorySynonyms: CategorySynonyms[] = [];

class CategoryMatchingService {
  private categorySynonyms: CategorySynonyms[] = [...DEFAULT_CATEGORY_SYNONYMS];

  constructor() {
    this.loadCustomSynonyms();
  }

  // Load any custom synonyms from local storage
  private async loadCustomSynonyms() {
    try {
      const storedSynonyms = localStorage.getItem('customCategorySynonyms');
      if (storedSynonyms) {
        customCategorySynonyms = JSON.parse(storedSynonyms);
        this.updateCategorySynonyms();
      }
    } catch (error) {
      console.error("Error loading custom synonyms:", error);
    }
  }

  // Save custom synonyms to local storage
  private saveCustomSynonyms() {
    try {
      localStorage.setItem('customCategorySynonyms', JSON.stringify(customCategorySynonyms));
    } catch (error) {
      console.error("Error saving custom synonyms:", error);
    }
  }

  // Update the merged synonym list
  private updateCategorySynonyms() {
    // Start with default synonyms
    this.categorySynonyms = [...DEFAULT_CATEGORY_SYNONYMS];
    
    // Add or update with custom synonyms
    customCategorySynonyms.forEach(customCategory => {
      const existingIndex = this.categorySynonyms.findIndex(
        c => c.categoryId === customCategory.categoryId
      );
      
      if (existingIndex >= 0) {
        // Merge synonyms for existing category
        this.categorySynonyms[existingIndex].synonyms = [
          ...new Set([
            ...this.categorySynonyms[existingIndex].synonyms,
            ...customCategory.synonyms
          ])
        ];
      } else {
        // Add new category synonyms
        this.categorySynonyms.push(customCategory);
      }
    });
  }

  // Add a synonym to a category
  public addSynonymToCategory(categoryId: string, synonym: string): boolean {
    synonym = this.normalizeText(synonym);
    if (!synonym) return false;
    
    // Find if the category already has custom synonyms
    const existingIndex = customCategorySynonyms.findIndex(
      c => c.categoryId === categoryId
    );
    
    if (existingIndex >= 0) {
      // Add to existing if not already there
      if (!customCategorySynonyms[existingIndex].synonyms.includes(synonym)) {
        customCategorySynonyms[existingIndex].synonyms.push(synonym);
      } else {
        return false; // Already exists
      }
    } else {
      // Create new entry
      customCategorySynonyms.push({
        categoryId,
        synonyms: [synonym]
      });
    }
    
    this.updateCategorySynonyms();
    this.saveCustomSynonyms();
    return true;
  }

  // Remove a synonym from a category
  public removeSynonymFromCategory(categoryId: string, synonym: string): boolean {
    synonym = this.normalizeText(synonym);
    
    const existingIndex = customCategorySynonyms.findIndex(
      c => c.categoryId === categoryId
    );
    
    if (existingIndex >= 0) {
      const synonymIndex = customCategorySynonyms[existingIndex].synonyms.indexOf(synonym);
      if (synonymIndex >= 0) {
        customCategorySynonyms[existingIndex].synonyms.splice(synonymIndex, 1);
        
        // If no synonyms left, remove the category entry
        if (customCategorySynonyms[existingIndex].synonyms.length === 0) {
          customCategorySynonyms.splice(existingIndex, 1);
        }
        
        this.updateCategorySynonyms();
        this.saveCustomSynonyms();
        return true;
      }
    }
    
    return false;
  }

  // Get all synonyms for a category
  public getSynonymsForCategory(categoryId: string): string[] {
    const categoryEntry = this.categorySynonyms.find(c => c.categoryId === categoryId);
    return categoryEntry ? [...categoryEntry.synonyms] : [];
  }

  // Utility to normalize text
  public normalizeText(text: string): string {
    if (!text) return '';
    
    return text.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^\w\s]/gi, '') // Remove special characters
      .trim();
  }

  // Find the best category match for a given expense description
  public async findBestCategoryMatch(description: string): Promise<{
    categoryId: string;
    confidence: number;
    possibleMatches: Array<{ category: Category; confidence: number }>;
  }> {
    description = this.normalizeText(description);
    const categories = await databaseService.getCategories();
    const words = description.split(/\s+/);
    
    // Track matches for each category
    const matchScores: Record<string, number> = {};
    
    // Initialize scores
    categories.forEach(category => {
      matchScores[category.id] = 0;
    });
    
    // Calculate match scores
    for (const word of words) {
      if (word.length < 3) continue; // Skip short words
      
      for (const categorySynonym of this.categorySynonyms) {
        for (const synonym of categorySynonym.synonyms) {
          // Direct match (higher score)
          if (synonym === word) {
            matchScores[categorySynonym.categoryId] += 10;
          }
          // Partial match (lower score)
          else if (synonym.includes(word) || word.includes(synonym)) {
            matchScores[categorySynonym.categoryId] += 
              5 * (Math.min(synonym.length, word.length) / Math.max(synonym.length, word.length));
          }
        }
        
        // Also check if the category name itself matches
        const category = categories.find(c => c.id === categorySynonym.categoryId);
        if (category) {
          const normalizedCategoryName = this.normalizeText(category.name);
          if (normalizedCategoryName === word) {
            matchScores[category.id] += 15; // Direct category name match (highest score)
          }
          else if (normalizedCategoryName.includes(word) || word.includes(normalizedCategoryName)) {
            matchScores[category.id] += 
              8 * (Math.min(normalizedCategoryName.length, word.length) / Math.max(normalizedCategoryName.length, word.length));
          }
        }
      }
    }
    
    // Find best match
    let bestCategoryId = "7"; // Default to "Otros" (id 7)
    let bestScore = 0;
    
    Object.entries(matchScores).forEach(([categoryId, score]) => {
      if (score > bestScore) {
        bestScore = score;
        bestCategoryId = categoryId;
      }
    });
    
    // Calculate confidence (0-1)
    const confidence = Math.min(bestScore / 15, 1); // Normalize to 0-1
    
    // Get possible alternative matches (for ambiguous cases)
    const CONFIDENCE_THRESHOLD = 0.4;
    const possibleMatches = categories
      .map(category => ({
        category,
        confidence: matchScores[category.id] / 15
      }))
      .filter(match => match.confidence > CONFIDENCE_THRESHOLD)
      .sort((a, b) => b.confidence - a.confidence);
    
    return {
      categoryId: bestCategoryId,
      confidence,
      possibleMatches
    };
  }
}

export const categoryMatchingService = new CategoryMatchingService();
