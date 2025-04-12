
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, History, PieChart, Settings, Plus, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { voiceRecognitionService } from "@/services/VoiceRecognitionService";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isRecording, setIsRecording] = React.useState(false);

  const startVoiceRecognition = async () => {
    setIsRecording(true);
    try {
      await voiceRecognitionService.startListening();
      
      // Automatically stop after 5 seconds if still recording
      setTimeout(() => {
        if (isRecording) {
          voiceRecognitionService.stopListening();
          setIsRecording(false);
        }
      }, 5000);
    } catch (error) {
      console.error("Error starting voice recognition:", error);
      setIsRecording(false);
    }
  };

  const stopVoiceRecognition = () => {
    voiceRecognitionService.stopListening();
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Main content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Add button (Centered above navbar) */}
      <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-10">
        <Button 
          variant="default" 
          size="icon" 
          className={cn(
            "voice-button relative",
            isRecording && "animate-pulse"
          )}
          onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
        >
          {isRecording ? (
            <>
              <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring"></div>
              <Mic className="h-6 w-6" />
            </>
          ) : (
            <Plus className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-2 z-10">
        <div className="flex justify-around items-center">
          <Link to="/" className="flex flex-col items-center">
            <div className={cn(
              "p-1.5 rounded-md",
              location.pathname === "/" ? "bg-primary/20 text-primary" : "text-muted-foreground"
            )}>
              <Home className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1">Inicio</span>
          </Link>
          
          <Link to="/history" className="flex flex-col items-center">
            <div className={cn(
              "p-1.5 rounded-md",
              location.pathname === "/history" ? "bg-primary/20 text-primary" : "text-muted-foreground"
            )}>
              <History className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1">Historial</span>
          </Link>
          
          <div className="w-16"></div> {/* Placeholder for the centered button */}
          
          <Link to="/categories" className="flex flex-col items-center">
            <div className={cn(
              "p-1.5 rounded-md",
              location.pathname === "/categories" ? "bg-primary/20 text-primary" : "text-muted-foreground"
            )}>
              <PieChart className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1">Categorías</span>
          </Link>
          
          <Link to="/settings" className="flex flex-col items-center">
            <div className={cn(
              "p-1.5 rounded-md",
              location.pathname === "/settings" ? "bg-primary/20 text-primary" : "text-muted-foreground"
            )}>
              <Settings className="h-5 w-5" />
            </div>
            <span className="text-xs mt-1">Ajustes</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;
