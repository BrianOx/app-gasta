
import React from "react";
import { Mic, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { voiceRecognitionService } from "@/services/VoiceRecognitionService";
import { cn } from "@/lib/utils";

interface VoiceButtonProps {
  className?: string;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ className }) => {
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
          <Mic className="h-6 w-6" />
        </>
      ) : (
        <Plus className="h-6 w-6" />
      )}
    </Button>
  );
};

export default VoiceButton;
