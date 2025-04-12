
import React, { useEffect, useState } from "react";
import MobileNavbar from "./MobileNavbar";
import { voiceRecognitionService } from "@/services/VoiceRecognitionService";
import { databaseService } from "@/services/DatabaseService";
import CategorySelectionModal from "@/components/expenses/CategorySelectionModal";
import { Category } from "@/models/Category";

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  // State for category selection modal
  const [categorySelectionOpen, setCategorySelectionOpen] = useState(false);
  const [possibleCategories, setPossibleCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("7"); // Default to "Otros"
  
  // Configurar un evento personalizado para recargar datos cuando se completa el reconocimiento de voz
  useEffect(() => {
    // Sobrescribe el método handleRecognitionResult para enviar un evento cuando termina
    const originalHandleResult = voiceRecognitionService["handleRecognitionResult"];
    
    if (originalHandleResult) {
      // @ts-ignore - Accedemos a método privado para sobrescribirlo
      voiceRecognitionService["handleRecognitionResult"] = async function(...args: any[]) {
        await originalHandleResult.apply(this, args);
        
        // Dispatchar evento personalizado cuando se completa el reconocimiento
        window.dispatchEvent(new CustomEvent('voiceRecognitionComplete'));
      };
    }
    
    return () => {
      // Restaurar el método original cuando se desmonta
      if (originalHandleResult) {
        // @ts-ignore - Restauramos el método original
        voiceRecognitionService["handleRecognitionResult"] = originalHandleResult;
      }
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
