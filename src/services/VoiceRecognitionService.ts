
// This file is now a barrel file that re-exports from the new modular structure
import { voiceRecognitionService } from "./voice-recognition/VoiceRecognitionService";

// Re-export the service to maintain backward compatibility
export { voiceRecognitionService };
