export interface LivenessSample { at: number; eye: number; yaw: number; descriptor: number[]; }
export interface LivenessChallenge { id: string; actions: ('left' | 'right')[]; issuedAt: string; expiresAt: string; }

/** Interactive motion check only; browser observations are not sensor attestation. */
export class LivenessCheck {
  readonly samples: LivenessSample[] = [];
  private phase = 0;
  private action = 0;
  private held = 0;
  private heldSince = 0;
  private yaw = 0;
  get identityMatched(): boolean { return this.phase > 0; }
  get complete(): boolean { return this.action === this.challenge.actions.length; }
  get similarityPercent(): number | null {
    const sample = this.samples.at(-1);
    if (!sample) return null;
    const distance = Math.sqrt(sample.descriptor.reduce((sum, value, i) => sum + (value - this.reference[i]) ** 2, 0));
    return Math.max(0, Math.min(100, Math.round((1 - distance / .8) * 100)));
  }
  get instruction(): string {
    if (this.complete) return 'Camera check complete. Keep looking at the camera and submit attendance.';
    if (this.phase === 0) return 'Checking your face against the saved profile… Look straight at the camera and hold still.';
    if (this.phase === 2) return 'Return to the center and hold still.';
    const action = this.challenge.actions[this.action];
    return `Step ${this.action + 1} of ${this.challenge.actions.length}: ` + `Slowly turn your head to your ${action}, then return to the center.`;
  }
  constructor(readonly challenge: LivenessChallenge, private reference: number[]) {}
  add(sample: LivenessSample): void {
    const prior = this.samples.at(-1);
    const distance = (a: number[], b: number[]) => Math.sqrt(a.reduce((sum, x, i) => sum + (x - b[i]) ** 2, 0));
    if (this.samples.length >= 240 || !Number.isFinite(sample.at) || sample.at < 0 ||
        (prior && sample.at <= prior.at) || sample.at - (prior?.at ?? 0) > 2500 ||
        !Number.isFinite(sample.eye) || sample.eye < 0 || sample.eye > 1 ||
        !Number.isFinite(sample.yaw) || Math.abs(sample.yaw) > 2 ||
        [sample.descriptor, this.reference].some(d => d.length !== 128 || d.some(x => !Number.isFinite(x) || Math.abs(x) > 2)) ||
        distance(sample.descriptor, this.reference) > .5 ||
        (this.samples.length && distance(sample.descriptor, this.samples[0].descriptor) > .5)) {
      throw new Error('Face tracking was interrupted. Keep one face in view and start again.');
    }
    this.samples.push(sample);
    if (this.phase === 0) {
      if (Math.abs(sample.yaw) > .15) { this.held = 0; return; }
      if (this.held++ === 0) this.heldSince = sample.at;
      if (this.held >= 3 && sample.at - this.heldSince >= 300) {
        this.yaw = sample.yaw; this.phase = 1; this.held = 0;
      }
      return;
    }
    const neutral = Math.abs(sample.yaw - this.yaw) < .08;
    if (this.complete) {
      if (!neutral) throw new Error('Keep looking straight at the camera. Start the check again.');
      return;
    }
    const action = this.challenge.actions[this.action];
    const achieved = this.phase === 2 ? neutral : action === 'left' ? sample.yaw - this.yaw < -.16 : sample.yaw - this.yaw > .16;
    if (!achieved) { this.held = 0; return; }
    if (this.held++ === 0) this.heldSince = sample.at;
    if (this.held >= 2 && sample.at - this.heldSince >= 150) {
      this.held = 0;
      if (this.phase === 1) this.phase = 2;
      else { this.action++; this.phase = 1; }
    }
  }
}
