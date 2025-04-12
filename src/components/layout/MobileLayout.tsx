
import React, { useEffect } from "react";
import MobileNavbar from "./MobileNavbar";
import { voiceRecognitionService } from "@/services/VoiceRecognitionService";
import { databaseService } from "@/services/DatabaseService";

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Main content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Mobile navigation */}
      <MobileNavbar />
    </div>
  );
};

export default MobileLayout;
