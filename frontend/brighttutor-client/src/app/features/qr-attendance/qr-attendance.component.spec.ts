import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
vi.mock('@vladmandic/face-api', () => ({}));
import { QrAttendanceComponent } from './qr-attendance.component';
import { QrAttendanceService } from '../../services/qr-attendance.service';
import { CourseService } from '../../services/course.service';
import { StudentService } from '../../services/student.service';
import { FaceRecognitionService } from '../../services/face-recognition.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { LivenessChallenge } from '../../services/liveness-check';

describe('QR camera fail-closed behavior', () => {
  let component: QrAttendanceComponent;
  let challenge: Subject<LivenessChallenge>;
  let face: ReturnType<typeof vi.fn>;
  let submit: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    challenge = new Subject(); face = vi.fn(); submit = vi.fn().mockReturnValue(of({}));
    TestBed.configureTestingModule({ providers: [
      { provide: QrAttendanceService, useValue: { startChallenge: () => challenge, scanCheckIn: submit } },
      { provide: CourseService, useValue: {} }, { provide: StudentService, useValue: {} },
      { provide: FaceRecognitionService, useValue: { extractFaceDescriptor: face } },
      { provide: AuthService, useValue: { isAdmin: () => false, isTeacher: () => false } },
      { provide: ToastService, useValue: { show: vi.fn() } },
    ] });
    component = TestBed.runInInjectionContext(() => new QrAttendanceComponent());
    component.selectedStudent.set({ id: 'student', firstName: 'Test', lastName: 'Student', studentCode: '1', email: '', faceDescriptorJson: JSON.stringify(Array(128).fill(.01)) });
    component.scannerForm.studentId = 'student'; component.scannerForm.classGroupId = 'group'; component.scannerForm.qrNonce = 'token';
    component.cameraActive.set(true);
    component.videoElement = { nativeElement: {} as HTMLVideoElement };
  });
  afterEach(() => { component.ngOnDestroy(); vi.restoreAllMocks(); });
  function issue() {
    component.startLivenessCheck();
    challenge.next({ id: 'challenge', actions: ['right', 'left'], issuedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60000).toISOString() });
  }
  it('cannot submit before completing the challenge', () => { component.onScanSubmit(); expect(submit).not.toHaveBeenCalled(); });
  it('recovers a stale classroom token once for staff', () => {
    vi.spyOn(component, 'canManage').mockReturnValue(true);
    const api = TestBed.inject(QrAttendanceService);
    api.generateSessionQr = vi.fn().mockReturnValue(of({ classGroupId: 'group', qrNonce: 'fresh' }));
    api.startChallenge = vi.fn().mockReturnValueOnce(throwError(() => ({ error: { code: 'QR_SESSION_INVALID' } })))
      .mockReturnValueOnce(of({ id: 'new', actions: ['left', 'right'], issuedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60000).toISOString() }));
    component.startLivenessCheck();
    expect(api.generateSessionQr).toHaveBeenCalledWith('group');
    expect(api.startChallenge).toHaveBeenLastCalledWith('student', 'group', 'fresh');
    expect((component as any).check.challenge.id).toBe('new');
  });
  it('does not loop indefinitely when token recovery fails', () => {
    vi.spyOn(component, 'canManage').mockReturnValue(true);
    const api = TestBed.inject(QrAttendanceService);
    api.generateSessionQr = vi.fn().mockReturnValue(of({ qrNonce: 'fresh' }));
    api.startChallenge = vi.fn().mockReturnValue(throwError(() => ({ error: { code: 'QR_SESSION_INVALID', message: 'Ask your teacher' } })));
    component.startLivenessCheck();
    expect(api.startChallenge).toHaveBeenCalledTimes(2);
    expect(api.generateSessionQr).toHaveBeenCalledTimes(1);
    expect(component.startingChallenge()).toBe(false);
  });
  it('does not retrieve classroom tokens for students', () => {
    const api = TestBed.inject(QrAttendanceService);
    api.generateSessionQr = vi.fn();
    api.startChallenge = vi.fn().mockReturnValue(throwError(() => ({ error: { code: 'QR_SESSION_INVALID', message: 'Ask your teacher' } })));
    component.startLivenessCheck();
    expect(api.generateSessionQr).not.toHaveBeenCalled();
    expect(component.biometricNotice()).toBe('Ask your teacher');
  });
  it('ignores a challenge response after the selection changes', () => {
    component.startLivenessCheck(); component.invalidateCheck();
    challenge.next({ id: 'old', actions: ['right', 'left'], issuedAt: '', expiresAt: '' });
    expect((component as any).check).toBeNull();
  });
  it('clears verification when no single face is visible', async () => {
    issue(); component.livenessComplete.set(true); face.mockResolvedValue(null);
    await component.scanAndVerifyFace();
    expect(component.livenessComplete()).toBe(false); expect((component as any).check).toBeNull();
  });
  it('clears verification when detection throws', async () => {
    issue(); component.livenessComplete.set(true); face.mockRejectedValue(new Error('Detection failed'));
    await component.scanAndVerifyFace(); expect(component.livenessComplete()).toBe(false);
  });
  it('does not restore a stale detection after resetting', async () => {
    issue(); let resolve!: (v: any) => void;
    face.mockReturnValue(new Promise(r => resolve = r));
    const pending = component.scanAndVerifyFace(); component.invalidateCheck();
    resolve({ descriptorArray: Array(128).fill(.01), eye: .3, yaw: 0 }); await pending;
    expect((component as any).check).toBeNull(); expect(component.liveDescriptorJson()).toBe('');
  });
  it('camera shutdown clears successful state', () => {
    component.livenessComplete.set(true); component.stopCamera();
    expect(component.livenessComplete()).toBe(false); expect(component.cameraActive()).toBe(false);
  });
  it('camera permission denial never marks a face as matched', async () => {
    component.cameraActive.set(false); component.viewMode.set('scanner');
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: vi.fn().mockRejectedValue(new Error('Denied')) } });
    await component.startCamera();
    expect(component.biometricStatus()).not.toBe('MATCHED'); expect(component.livenessComplete()).toBe(false);
    expect(component.biometricNotice()).toContain('teacher');
  });
});
