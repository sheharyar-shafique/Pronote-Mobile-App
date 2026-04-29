import { VoiceRecorder } from '@capacitor-community/voice-recorder';
import { isNative } from './platform';

export interface RecordingResult {
  base64Audio: string;
  mimeType: string;
  durationMs: number;
}

export async function requestMicPermission(): Promise<boolean> {
  if (!isNative()) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return true;
    } catch {
      return false;
    }
  }
  const res = await VoiceRecorder.requestAudioRecordingPermission();
  return res.value === true;
}

export async function startRecording(): Promise<void> {
  if (!isNative()) {
    throw new Error('startRecording (native) called on web — use the existing MediaRecorder flow.');
  }
  const can = await VoiceRecorder.canDeviceVoiceRecord();
  if (!can.value) throw new Error('Device cannot record audio.');
  await VoiceRecorder.startRecording();
}

export async function stopRecording(): Promise<RecordingResult> {
  const res = await VoiceRecorder.stopRecording();
  return {
    base64Audio: res.value.recordDataBase64,
    mimeType: res.value.mimeType,
    durationMs: res.value.msDuration,
  };
}

export async function pauseRecording(): Promise<void> {
  await VoiceRecorder.pauseRecording();
}

export async function resumeRecording(): Promise<void> {
  await VoiceRecorder.resumeRecording();
}

/**
 * Convert the base64 audio returned by the native recorder into a Blob
 * suitable for FormData upload to the existing /audio backend route.
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars = atob(base64);
  const bytes = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}
