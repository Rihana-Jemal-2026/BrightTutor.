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
  eye: number;
  yaw: number;
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
  private modelLoad: Promise<void> | null = null;

  async loadModels(): Promise<void> {
    if (this.modelsLoaded()) return;
    if (this.modelLoad) return this.modelLoad;
    this.modelLoad = this.initializeModels();
    try { await this.modelLoad; } finally { this.modelLoad = null; }
  }

  private async initializeModels(): Promise<void> {
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
      .detectAllFaces(input, options)
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (result.length !== 1) return null;

    const face = result[0];
    const points = face.landmarks.positions;
    const distance = (a: number, b: number) => Math.hypot(points[a].x - points[b].x, points[a].y - points[b].y);
    const eyeRatio = (offset: number) => (distance(offset + 1, offset + 5) + distance(offset + 2, offset + 4)) / (2 * distance(offset, offset + 3));
    const leftX = (points[36].x + points[39].x) / 2;
    const rightX = (points[42].x + points[45].x) / 2;

    const box = face.detection.box;
    return {
      descriptor: face.descriptor,
      descriptorArray: Array.from(face.descriptor),
      eye: (eyeRatio(36) + eyeRatio(42)) / 2,
      // Raw camera pixels are not mirrored: the person's left is image-right.
      yaw: ((leftX + rightX) / 2 - points[30].x) / Math.abs(rightX - leftX),
      detectionBox: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height
      },
      score: Math.round(face.detection.score * 100)
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
