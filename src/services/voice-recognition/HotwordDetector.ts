
import { toast } from "@/components/ui/use-toast";
import { voiceRecognitionManager } from "./VoiceRecognitionManager";

class HotwordDetector {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;

  constructor() {
    this.setupRecognition();
  }

  private setupRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error("Speech recognition not supported");
      return;
    }

    // @ts-ignore - SpeechRecognition may not be in the TypeScript definitions
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    if (this.recognition) {
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-ES';

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
        if (transcript.includes('hey luzi') || transcript.includes('hey lusi') || transcript.includes('hey lucy')) {
          console.log("Hotword detected!");
          this.pauseListening();
          voiceRecognitionManager.startExpenseRecognition();
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error !== 'no-speech') {
          console.error("Hotword detection error:", event.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          this.recognition?.start();
        }
      };
    }
  }

  public startListening() {
    if (!this.recognition) {
      this.setupRecognition();
    }

    if (this.recognition && !this.isListening) {
      this.isListening = true;
      this.recognition.start();
      console.log("Hotword detection started");
    }
  }

  public pauseListening() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      console.log("Hotword detection paused");
    }
  }

  public resumeListening() {
    if (!this.isListening) {
      this.startListening();
    }
  }

  public stopListening() {
    if (this.recognition) {
      this.isListening = false;
      this.recognition.stop();
      console.log("Hotword detection stopped");
    }
  }
}

export const hotwordDetector = new HotwordDetector();
