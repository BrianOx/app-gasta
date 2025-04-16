
import { voiceRecognitionManager } from "./VoiceRecognitionManager";
import { hotwordDetector } from "./HotwordDetector";
import { audioPermissionManager } from "./AudioPermissionManager";

class VoiceRecognitionService {
  constructor() {
    this.initializeHotwordDetection();
  }

  private async initializeHotwordDetection() {
    if (await audioPermissionManager.requestMicrophonePermission()) {
      hotwordDetector.startListening();
    }
  }

  public startListening(): Promise<void> {
    voiceRecognitionManager.startExpenseRecognition();
    return Promise.resolve();
  }

  public stopListening(): void {
    voiceRecognitionManager.stopListening();
  }

  public isRecognitionSupported(): boolean {
    return audioPermissionManager.isRecognitionSupported();
  }
}

export const voiceRecognitionService = new VoiceRecognitionService();
