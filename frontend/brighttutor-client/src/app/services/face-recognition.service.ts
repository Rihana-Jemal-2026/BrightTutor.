import { Injectable, signal } from '@angular/core';
import * as faceapi from '@vladmandic/face-api';

export interface FaceDetectionResult {
  descriptor: Float32Array;
  descriptorArray: number[];
  detectionBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  score: number;
}

export interface FaceComparisonResult {
  distance: number;
  confidencePercent: number;
  isMatch: boolean;
  verdict: 'MATCH_CONFIRMED' | 'MISMATCH_DETECTED' | 'NO_FACE';
}

@Injectable({
  providedIn: 'root'
})
export class FaceRecognitionService {
  modelsLoaded = signal<boolean>(false);
  loadingModels = signal<boolean>(false);

  async loadModels(): Promise<void> {
    if (this.modelsLoaded() || this.loadingModels()) return;

    try {
      this.loadingModels.set(true);
      const MODEL_URL = '/models';

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);

      this.modelsLoaded.set(true);
      this.loadingModels.set(false);
      console.log('✅ Biometric Face-API Neural Models Loaded Successfully');
    } catch (err) {
      console.error('Failed to load Face-API models:', err);
      this.loadingModels.set(false);
      throw err;
    }
  }

  async extractFaceDescriptor(
    input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
  ): Promise<FaceDetectionResult | null> {
    await this.loadModels();

    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 });
    const result = await faceapi
      .detectSingleFace(input, options)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!result) return null;

    const box = result.detection.box;
    return {
      descriptor: result.descriptor,
      descriptorArray: Array.from(result.descriptor),
      detectionBox: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height
      },
      score: Math.round(result.detection.score * 100)
    };
  }

  compareDescriptors(
    descriptorA: Float32Array | number[],
    descriptorB: Float32Array | number[],
    threshold = 0.50
  ): FaceComparisonResult {
    const arrayA = descriptorA instanceof Float32Array ? descriptorA : new Float32Array(descriptorA);
    const arrayB = descriptorB instanceof Float32Array ? descriptorB : new Float32Array(descriptorB);

    const distance = faceapi.euclideanDistance(arrayA, arrayB);
    
    // Convert Euclidean Distance (0.00 to 1.00+) into a human-readable 0% - 100% confidence score
    // Distance of 0.0 -> 100% Match
    // Distance of 0.4 -> ~80% Match
    // Distance >= 0.6 -> < 40% (Mismatch)
    const confidencePercent = Math.max(0, Math.min(100, Math.round((1 - (distance / 0.8)) * 100)));
    const isMatch = distance <= threshold;

    return {
      distance: Number(distance.toFixed(4)),
      confidencePercent,
      isMatch,
      verdict: isMatch ? 'MATCH_CONFIRMED' : 'MISMATCH_DETECTED'
    };
  }
}
