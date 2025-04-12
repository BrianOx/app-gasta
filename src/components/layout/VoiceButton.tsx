
import React from "react";
import { Mic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { voiceRecognitionService } from "@/services/VoiceRecognitionService";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface VoiceButtonProps {
  className?: string;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ className }) => {
  const [isRecording, setIsRecording] = React.useState(false);
  const [countdown, setCountdown] = React.useState<number | null>(null);
  const countdownTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const startVoiceRecognition = async () => {
    if (!voiceRecognitionService.isRecognitionSupported()) {
      toast({
        title: "No soportado",
        description: "Tu navegador no soporta reconocimiento de voz",
        variant: "destructive"
      });
      return;
    }
    
    setIsRecording(true);
    setCountdown(10); // 10 segundos para grabar
    
    try {
      await voiceRecognitionService.startListening();
      
      // Iniciar temporizador regresivo
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            if (countdownTimerRef.current) {
              clearInterval(countdownTimerRef.current);
            }
            voiceRecognitionService.stopListening();
            setIsRecording(false);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Error starting voice recognition:", error);
      setIsRecording(false);
      setCountdown(null);
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    }
  };

  const stopVoiceRecognition = () => {
    voiceRecognitionService.stopListening();
    setIsRecording(false);
    setCountdown(null);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
  };

  return (
    <Button 
      variant="default" 
      size="icon" 
      className={cn(
        "voice-button relative",
        isRecording && "animate-pulse",
        className
      )}
      onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
    >
      {isRecording ? (
        <>
          <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring"></div>
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-primary text-white px-2 py-1 rounded-full text-xs">
            {countdown}s
          </div>
          <Mic className="h-6 w-6" />
        </>
      ) : (
        <Plus className="h-6 w-6" />
      )}
    </Button>
  );
};

export default VoiceButton;
