
import React, { useEffect, useState } from "react";
import MobileNavbar from "./MobileNavbar";
import { voiceRecognitionService } from "@/services/VoiceRecognitionService";
import { databaseService } from "@/services/DatabaseService";
import CategorySelectionModal from "@/components/expenses/CategorySelectionModal";
import { Category } from "@/models/Category";
import { toast } from "@/components/ui/use-toast";

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  // State for category selection modal
  const [categorySelectionOpen, setCategorySelectionOpen] = useState(false);
  const [possibleCategories, setPossibleCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("7"); // Default to "Otros"
  
  // Handle voice recognition complete event
  useEffect(() => {
    const handleVoiceRecognitionComplete = () => {
      console.log("Voice recognition complete event received");
    };
    
    window.addEventListener('voiceRecognitionComplete', handleVoiceRecognitionComplete);
    
    return () => {
      window.removeEventListener('voiceRecognitionComplete', handleVoiceRecognitionComplete);
    };
  }, []);
  
  // Handle ambiguous category detection
  useEffect(() => {
    const handleAmbiguousCategory = async (event: CustomEvent) => {
      console.log("Ambiguous category detected:", event.detail);
      
      // Get the possible categories from the event
      const { possibleMatches } = event.detail;
      
      if (possibleMatches && possibleMatches.length > 0) {
        // Convert match objects to categories array
        const categories = possibleMatches.map((match: any) => match.category);
        
        // Pre-select the highest confidence category
        setSelectedCategoryId(categories[0].id);
        setPossibleCategories(categories);
        
        // Show the selection modal
        setCategorySelectionOpen(true);
        
        // Also show a toast to make it more obvious
        toast({
          title: "Selecciona una categoría",
          description: "Por favor selecciona la categoría correcta para este gasto",
        });
      }
    };
    
    // Add event listener
    window.addEventListener(
      'voiceRecognitionAmbiguousCategory', 
      handleAmbiguousCategory as EventListener
    );
    
    // Clean up
    return () => {
      window.removeEventListener(
        'voiceRecognitionAmbiguousCategory', 
        handleAmbiguousCategory as EventListener
      );
    };
  }, []);
  
  // Handlers for category selection
  const handleConfirmCategory = async () => {
    await voiceRecognitionService.confirmCategoryForPendingExpense(selectedCategoryId);
    setCategorySelectionOpen(false);
  };
  
  const handleCancelCategory = () => {
    setCategorySelectionOpen(false);
    toast({
      title: "Operación cancelada",
      description: "El gasto no ha sido registrado",
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Main content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Mobile navigation */}
      <MobileNavbar />
      
      {/* Category selection modal */}
      <CategorySelectionModal
        open={categorySelectionOpen}
        onOpenChange={setCategorySelectionOpen}
        categories={possibleCategories}
        selectedCategoryId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
        onConfirm={handleConfirmCategory}
        onCancel={handleCancelCategory}
      />
    </div>
  );
};

export default MobileLayout;
