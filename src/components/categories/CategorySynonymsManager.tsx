
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Category } from "@/models/Category";
import { categoryMatchingService } from "@/services/CategoryMatchingService";
import { toast } from "@/components/ui/use-toast";

interface CategorySynonymsManagerProps {
  category: Category;
}

const CategorySynonymsManager: React.FC<CategorySynonymsManagerProps> = ({ category }) => {
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [newSynonym, setNewSynonym] = useState("");

  // Load synonyms when category changes
  useEffect(() => {
    if (category) {
      const categorySynonyms = categoryMatchingService.getSynonymsForCategory(category.id);
      setSynonyms(categorySynonyms);
    }
  }, [category]);

  const handleAddSynonym = () => {
    const trimmedSynonym = newSynonym.trim();
    
    if (!trimmedSynonym) {
      return;
    }
    
    if (synonyms.includes(categoryMatchingService.normalizeText(trimmedSynonym))) {
      toast({
        title: "Error",
        description: "Este sinónimo ya existe para esta categoría.",
        variant: "destructive",
      });
      return;
    }
    
    const success = categoryMatchingService.addSynonymToCategory(category.id, trimmedSynonym);
    
    if (success) {
      // Refresh the list
      const updatedSynonyms = categoryMatchingService.getSynonymsForCategory(category.id);
      setSynonyms(updatedSynonyms);
      setNewSynonym("");
      
      toast({
        title: "Sinónimo agregado",
        description: `Se agregó "${trimmedSynonym}" como sinónimo de ${category.name}.`,
      });
    }
  };

  const handleRemoveSynonym = (synonym: string) => {
    const success = categoryMatchingService.removeSynonymFromCategory(category.id, synonym);
    
    if (success) {
      // Refresh the list
      const updatedSynonyms = categoryMatchingService.getSynonymsForCategory(category.id);
      setSynonyms(updatedSynonyms);
      
      toast({
        title: "Sinónimo eliminado",
        description: `Se eliminó "${synonym}" como sinónimo de ${category.name}.`,
      });
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Sinónimos para {category.name}</h3>
      
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Agregar sinónimo..."
          value={newSynonym}
          onChange={(e) => setNewSynonym(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleAddSynonym();
            }
          }}
        />
        <Button onClick={handleAddSynonym}>Agregar</Button>
      </div>
      
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2">
        {synonyms.map((synonym) => (
          <Badge key={synonym} variant="secondary" className="px-2 py-1">
            {synonym}
            <button
              onClick={() => handleRemoveSynonym(synonym)}
              className="ml-1 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        
        {synonyms.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay sinónimos para esta categoría.
          </p>
        )}
      </div>
    </div>
  );
};

export default CategorySynonymsManager;
