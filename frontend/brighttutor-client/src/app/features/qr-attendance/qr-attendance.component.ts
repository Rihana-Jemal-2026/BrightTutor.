import { Component, OnInit, OnDestroy, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LivenessCheck } from '../../services/liveness-check';
import * as QRCode from 'qrcode';
import { FormsModule } from '@angular/forms';
import { QrAttendanceService, QrSessionDto, LiveAttendeeDto } from '../../services/qr-attendance.service';
import { CourseService, ClassGroupDto } from '../../services/course.service';
import { StudentService, StudentDto } from '../../services/student.service';
import { FaceRecognitionService, FaceComparisonResult } from '../../services/face-recognition.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-qr-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="qr-page">
      <div class="page-header">
        <h1>QR Attendance & Camera Check</h1>
        <p>Use the classroom QR token and follow a short camera check to record attendance.</p>
      </div>

      <!-- View Selector -->
      <div class="view-switch">
        <button
          type="button"
          class="switch-btn"
          [hidden]="!canManage()" [class.active]="viewMode() === 'projector'"
          (click)="setViewMode('projector')"
        >
           Classroom Projector Display & Live Roll Call
        </button>
        <button
          type="button"
          class="switch-btn"
          [class.active]="viewMode() === 'scanner'"
          (click)="setViewMode('scanner')"
        >
           Student Mobile Check-In Scanner (Camera + Face Match)
        </button>
      </div>

      <!-- 1. Classroom Projector View -->
      @if (viewMode() === 'projector') {
        <div class="projector-card">
          <div class="group-select-row">
            <label>Select Class Group for Live Display:</label>
            <select [(ngModel)]="selectedClassGroupId" (change)="onGroupSelected()" class="form-control">
              <option value="">-- Choose Classroom Group --</option>
              @for (group of classGroups(); track group.id) {
                <option [value]="group.id">{{ group.name }} ({{ group.courseName }})</option>
              }
            </select>
          </div>

          @if (qrSession()) {
            <div class="qr-display-box">
              <div class="qr-badge">LIVE CLASSROOM QR CODE</div>
              <h2>{{ qrSession()?.groupName }}</h2>
              <p class="course-sub">{{ qrSession()?.courseName }}</p>

              <!-- Real High-Resolution Scannable QR Code -->
              <div class="qr-code-graphic">
                <div class="qr-image-wrapper">
                  <img
                    [src]="qrImageUrl()"
                    alt="Classroom Attendance QR Code"
                    class="real-qr-image"
                  />
                  <div class="qr-pulse-border"></div>
                </div>
              </div>

              <div class="qr-meta">
                <p class="location-tag"> Location: <strong>{{ qrSession()?.location }}</strong></p>
                <p class="nonce-tag">
                   Dynamic Security Nonce:
                  <code class="nonce-code">{{ qrSession()?.qrNonce }}</code>
                </p>
                <p class="timestamp-tag"> Live Session Time: {{ qrSession()?.timestamp | date:'mediumTime' }}</p>
                <p class="timestamp-tag">Expires at {{ qrSession()?.expiresAt | date:'mediumTime' }}. Refresh to issue a new token.</p>
              </div>

              <div class="qr-actions-row">
                <button type="button" class="btn-refresh-qr" (click)="onGroupSelected(true)">
                   Refresh QR Nonce
                </button>
                <button type="button" class="btn-quick-scan" (click)="useNonceForScanner()">
                   Test Scanner With This QR Nonce
                </button>
              </div>
            </div>

            <!-- LIVE CLASSROOM ATTENDEE ROLL CALL FEED -->
            <div class="live-roll-call-section">
              <div class="roll-call-header">
                <h3>Live Classroom Checked-In Attendees (Today)</h3>
                <span class="attendee-count-badge">{{ liveAttendees().length }} Students Present</span>
              </div>

              @if (liveAttendees().length > 0) {
                <div class="attendee-cards-grid">
                  @for (att of liveAttendees(); track att.attendanceId) {
                    <div class="attendee-card">
                      <div class="attendee-photos-row">
                        @if (att.referencePhotoUrl) {
                          <div class="photo-box">
                            <img [src]="att.referencePhotoUrl" alt="Reference Photo" class="thumb-img" />
                            <span class="photo-tag">Enrolled Photo</span>
                          </div>
                        }
                        @if (att.liveSnapshotUrl) {
                          <div class="photo-box">
                            <img [src]="att.liveSnapshotUrl" alt="Live Snapshot" class="thumb-img live" />
                            <span class="photo-tag live">Today's Check-In</span>
                          </div>
                        }
                      </div>

                      <div class="attendee-info">
                        <h4>{{ att.studentName }}</h4>
                        <span class="student-code-text">{{ att.studentCode }}</span>
                        <div class="checkin-meta-row">
                          <span class="time-text"> {{ att.checkInTime }}</span>
                          @if (att.matchConfidence !== null) { <span class="confidence-badge">{{ att.matchConfidence | number:'1.0-0' }}% face similarity</span> }
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-roll-call">
                  <p> Awaiting student check-ins. Students scanning the QR code with verified Face ID will appear here in real-time.</p>
                </div>
              }
            </div>
          } @else {
            <div class="select-prompt">
              <span class="prompt-icon"></span>
              <p>Please select a class group above to project the live classroom QR Code onto the screen.</p>
            </div>
          }
        </div>
      }

      <!-- 2. Student Scanner View with Anti-Proxy Biometric Face ID -->
      @if (viewMode() === 'scanner') {
        <div class="scanner-card">
          <div class="scanner-header">
            <h3>Student Camera Check-In</h3>
            <p>Select your class, enter the classroom token, and follow the camera instructions.</p>
          </div>

          <!-- Verified Success Banner if checked in -->
          @if (verifiedResult()) {
            <div class="verified-success-card">
              <div class="success-header">
                <div class="success-icon"><svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg></div>
                <div>
                  <h4>Attendance Successfully Verified!</h4>
                  <p>{{ verifiedResult()?.message }}</p>
                </div>
              </div>

              <div class="success-details-grid">
                <div><strong>Status:</strong> <span class="badge-present">{{ verifiedResult()?.status }}</span></div>
                <div><strong>Check-In Time:</strong> {{ verifiedResult()?.checkInTime }}</div>
                <div><strong>Camera check:</strong> <span class="badge-match">Completed</span></div>
                @if (verifiedResult()?.faceConfidence != null) {
                  <div><strong>Face similarity:</strong> <span class="badge-match">{{ verifiedResult().faceConfidence | number:'1.0-0' }}%</span></div>
                }
              </div>

              <div class="side-by-side-proof">
                @if (selectedStudent()?.profilePhotoUrl) {
                  <div class="proof-photo-item">
                    <span class="proof-label"> Enrolled Master Profile:</span>
                    <img [src]="selectedStudent()!.profilePhotoUrl" alt="Master Profile" class="proof-img" />
                  </div>
                }
                @if (capturedSnapshot()) {
                  <div class="proof-photo-item">
                    <span class="proof-label"> Today's Live Selfie Proof:</span>
                    <img [src]="capturedSnapshot()" alt="Live Selfie" class="proof-img live-ring" />
                  </div>
                }
              </div>

              <button type="button" class="btn-checkin-another" (click)="resetVerification()">
                 Check In Another Student
              </button>
            </div>
          } @else {
            <form (ngSubmit)="onScanSubmit()">
              <div class="form-grid-2">
                <div class="form-group">
                  <label>Select Your Student Profile *</label>
                  <select [(ngModel)]="scannerForm.studentId" (change)="onStudentSelected()" name="studentId" required class="form-control">
                    <option value="">-- Select Student Account --</option>
                    @for (student of students(); track student.id) {
                      <option [value]="student.id">{{ student.firstName }} {{ student.lastName }} ({{ student.studentCode }})</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label>Select Target Class Group *</label>
                  <select [(ngModel)]="scannerForm.classGroupId" (ngModelChange)="invalidateCheck()" name="classGroupId" required class="form-control">
                    <option value="">-- Select Class Group --</option>
                    @for (group of classGroups(); track group.id) {
                      <option [value]="group.id">{{ group.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- STUDENT MASTER FACE ID PROFILE STATUS & ENROLLMENT BANNER -->
              @if (selectedStudent()) {
                <div class="student-face-profile-card">
                  <div class="profile-card-left">
                    @if (selectedStudent()?.profilePhotoUrl) {
                      <img [src]="selectedStudent()!.profilePhotoUrl" alt="Master Face ID" class="master-face-avatar" />
                      <div>
                        <div class="master-enrolled-badge">
                          <span class="badge-icon"></span> Master Biometric Enrolled
                        </div>
                        <p class="profile-student-title">{{ selectedStudent()!.firstName }} {{ selectedStudent()!.lastName }} ({{ selectedStudent()!.studentCode }})</p>
                      </div>
                    } @else {
                      <div class="master-face-empty"></div>
                      <div>
                        <div class="master-pending-badge">
                          <span class="badge-icon"></span> No Master Face ID Enrolled Yet
                        </div>
                        <p class="profile-student-title">Ask an administrator to enroll your face before using camera check-in.</p>
                      </div>
                    }
                  </div>

                  <div class="profile-card-actions" [hidden]="!auth.isAdmin()">
                    <button type="button" class="btn-enroll-live" (click)="enrollCurrentFaceAsMaster()">
                       {{ selectedStudent()?.profilePhotoUrl ? 'Update Master Face Photo' : 'Save Camera as Master Face ID' }}
                    </button>
                    <label class="btn-enroll-file">
                       Upload Photo
                      <input type="file" accept="image/*" (change)="onUploadMasterFace($event)" style="display: none;" />
                    </label>
                  </div>
                </div>
              }

              <div class="form-group">
                <label>Classroom QR Token Nonce *</label>
                @if (canManage()) {
                  <button type="button" class="btn-refresh-qr" [disabled]="startingChallenge() || checkingIn() || !scannerForm.classGroupId" (click)="refreshScannerToken()">Get current classroom token</button>
                }
                <div class="nonce-input-group">
                  <input
                    type="text"
                    [(ngModel)]="scannerForm.qrNonce" (ngModelChange)="invalidateCheck()"
                    name="qrNonce"
                    placeholder="Enter the current classroom QR token"
                    required
                    class="form-control nonce-input"
                  />
                </div>
              </div>

              <!-- LIVE WEB CAMERA & AI BIOMETRIC 1:1 FACE RECOGNITION -->
              <div class="biometric-scanner-container">
                <div class="camera-viewport-box">
                  <!-- Video Stream Feed -->
                  <video #videoElement autoplay playsinline muted class="camera-video-feed" [class.hidden]="!cameraActive()"></video>

                  <!-- Fallback Face Radar Canvas if Camera is not supported / blocked -->
                  @if (!cameraActive()) {
                    <div class="camera-simulation-mesh" style="display:flex;align-items:center;justify-content:center;color:white;">
                      <p>Camera off. Start your camera to begin.</p>
                    </div>
                  }

                  <!-- Face Target Laser Frame -->
                  <div
                    class="face-target-ring"
                    [class.face-locked]="biometricStatus() === 'MATCHED' || biometricStatus() === 'ENROLLED'"
                    [class.face-mismatch]="biometricStatus() === 'MISMATCH'"
                  >
                    <div class="laser-scanner-line" [class.laser-red]="biometricStatus() === 'MISMATCH'"></div>
                    <div class="corner-bracket top-left"></div>
                    <div class="corner-bracket top-right"></div>
                    <div class="corner-bracket bottom-left"></div>
                    <div class="corner-bracket bottom-right"></div>
                  </div>

                  <!-- Live Biometric Real-Time Status Pill -->
                  <div class="camera-status-overlay">
                    @if (biometricStatus() === 'MATCHED') {
                      <span class="status-pill status-verified">
                        <span class="pulse-dot-green"></span>  Camera check complete
                      </span>
                    } @else if (biometricStatus() === 'MISMATCH') {
                      <span class="status-pill status-mismatch">
                        <span class="pulse-dot-red"></span>  Camera check needs attention
                      </span>
                    } @else if (biometricStatus() === 'ENROLLED') {
                      <span class="status-pill status-enrolled">
                        <span class="pulse-dot-green"></span>  Face profile registered. Start the camera check.
                      </span>
                    } @else {
                      <span class="status-pill status-scanning">
                        <span class="pulse-dot-yellow"></span> {{ identityMatched() ? 'Face matched · Complete the liveness check' : 'Face matching · Look straight at the camera' }}
                      </span>
                    }
                  </div>
                </div>

                <!-- Camera Controls & Face Trigger -->
                <div class="camera-controls-bar">
                  <button type="button" class="btn-camera-toggle" (click)="toggleCamera()">
                    {{ cameraActive() ? ' Turn Off Camera' : ' Start Live Web Camera' }}
                  </button>
                  <button type="button" class="btn-verify-face" (click)="startLivenessCheck()" [disabled]="!cameraActive() || startingChallenge() || checkingIn()">
                     {{ startingChallenge() ? 'Starting…' : 'Start / Restart Camera Check' }}
                  </button>
                </div>
              </div>

              <div class="biometric-feedback-notice" [ngClass]="biometricStatusClass()">
                <p><strong>1. Face matching:</strong> {{ identityMatched() ? 'Passed' : matchingFace() || startingChallenge() ? 'Checking…' : 'Waiting to start' }}</p>
                <p><strong>2. Liveness check:</strong> {{ livenessComplete() ? 'Passed' : identityMatched() ? 'Follow the head-turn instructions below' : 'Starts automatically after your face matches' }}</p>
                @if (identityMatched() && liveDescriptorJson()) {
                  <p><strong>Face similarity: {{ biometricConfidence() }}%</strong> · Compared with the enrolled profile</p>
                }
                <p role="status" aria-live="polite">{{ biometricNotice() }}</p>
                @if (challengeSeconds() > 0) { <p>{{ challengeSeconds() }} seconds remaining</p> }
                <p>Having trouble with the camera or movements? Ask your teacher to mark attendance manually.</p>
                @if (canManage()) { <a routerLink="/mark-group-attendance">Open teacher attendance</a> }
              </div>

              <!-- Submit Check-in button -->
              <button
                type="submit"
                class="btn-checkin"
                [disabled]="checkingIn() || !livenessComplete()"
              >
                @if (checkingIn()) {
                   Verifying Biometrics & Marking Attendance...
                } @else if (biometricStatus() === 'MISMATCH') {
                   Check-In Blocked (Face Mismatch)
                } @else {
                   Submit Verified Attendance Check-In
                }
              </button>
            </form>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; min-width: 0; }
    .qr-page {
      width: 100%;
      box-sizing: border-box;
      padding: 1.5rem;
      max-width: 1050px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 1.5rem;
      h1 {
        color: var(--color-text);
        font-size: 1.75rem;
        font-weight: 800;
        margin-bottom: 0.25rem;
      }
      p {
        color: var(--color-muted);
        font-size: 0.95rem;
        margin: 0;
      }
    }

    .view-switch {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;

      .switch-btn {
        min-width: 0;
        white-space: normal;
        flex: 1;
        padding: 0.85rem 1.25rem;
        border-radius: 10px;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        border: 1.5px solid var(--color-border);
        background: var(--color-surface);
        color: var(--color-text);
        transition: all 0.2s ease;

        &.active {
          background: var(--color-action);
          color: #ffffff;
          border-color: var(--color-primary);
          box-shadow: var(--shadow-card);
        }
      }
    }

    .projector-card, .scanner-card {
      min-width: 0;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      padding: 2rem;
      box-shadow: var(--shadow-card, 0 4px 20px rgba(0, 0, 0, 0.05));
    }

    .group-select-row {
      margin-bottom: 1.5rem;
      label {
        display: block;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: var(--color-text);
      }
      select {
        width: 100%;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        border: 1.5px solid var(--color-border);
        background: var(--color-bg);
        color: var(--color-text);
        font-size: 1rem;
      }
    }

    .qr-display-box {
      text-align: center;
      background: var(--color-bg);
      border: 2px dashed var(--color-border);
      border-radius: 16px;
      padding: 2rem 1.5rem;
      margin-bottom: 2rem;

      .qr-badge {
        display: inline-block;
        background: var(--color-action);
        color: white;
        padding: 0.3rem 0.85rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 800;
        letter-spacing: 0.05em;
        margin-bottom: 0.75rem;
      }

      h2 { margin: 0 0 0.25rem 0; color: var(--color-text); font-size: 1.6rem; font-weight: 800; }
      .course-sub { color: var(--color-muted); margin: 0 0 1.5rem 0; font-size: 1rem; }
    }

    .qr-code-graphic {
      display: flex;
      justify-content: center;
      margin-bottom: 1.5rem;

      .qr-image-wrapper {
        position: relative;
        padding: 12px;
        background: var(--color-surface);
        border-radius: 16px;
        box-shadow: var(--shadow-card);

        .real-qr-image {
          width: 220px;
          height: 220px;
          display: block;
          border-radius: 8px;
        }

        .qr-pulse-border {
          position: absolute;
          inset: -4px;
          border: 2px solid var(--color-accent-bright);
          border-radius: 20px;
          animation: qrPulse 2s infinite;
          pointer-events: none;
        }
      }
    }

    @keyframes qrPulse {
      0% { opacity: 0.8; transform: scale(1); }
      50% { opacity: 0.2; transform: scale(1.03); }
      100% { opacity: 0.8; transform: scale(1); }
    }

    .qr-meta {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.9rem;
      color: var(--color-text);
      margin-bottom: 1.5rem;

      .nonce-code {
        background: var(--color-action);
        color: #ffffff;
        padding: 0.2rem 0.6rem;
        border-radius: 6px;
        font-weight: 800;
        letter-spacing: 0.08em;
      }
    }

    .qr-actions-row {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;

      button {
        padding: 0.75rem 1.25rem;
        border-radius: 8px;
        font-weight: 700;
        cursor: pointer;
        border: 1px solid var(--color-border);
        background: var(--color-surface);
        color: var(--color-text);
        transition: all 0.2s;

        &.btn-quick-scan {
          background: var(--color-action);
          color: white;
          border-color: var(--color-accent-bright);
        }
      }
    }

    /* Live Roll Call Section */
    .live-roll-call-section {
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 1.5rem;

      .roll-call-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.25rem;

        h3 { margin: 0; color: var(--color-text); font-size: 1.2rem; font-weight: 800; }
        .attendee-count-badge {
          background: var(--color-success-bg);
          color: var(--color-accent-bright);
          border: 1px solid var(--color-border);
          padding: 0.3rem 0.75rem;
          border-radius: 20px;
          font-weight: 800;
          font-size: 0.85rem;
        }
      }

      .attendee-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
      }

      .attendee-card {
        background: var(--color-bg);
        border: 1.5px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: 1rem;
        display: flex;
        gap: 1rem;
        align-items: center;

        .attendee-photos-row {
          display: flex;
          gap: 0.4rem;

          .photo-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.2rem;

            .thumb-img {
              width: 52px;
              height: 52px;
              object-fit: cover;
              border-radius: 8px;
              border: 1.5px solid var(--color-border);

              &.live {
                border-color: var(--color-accent-bright);
              }
            }

            .photo-tag {
              font-size: 0.65rem;
              color: var(--color-muted);
              &.live { color: var(--color-accent); font-weight: 700; }
            }
          }
        }

        .attendee-info {
          flex: 1;
          h4 { margin: 0 0 0.15rem 0; font-size: 0.95rem; color: var(--color-text); font-weight: 800; }
          .student-code-text { font-size: 0.75rem; color: var(--color-muted); }
          .checkin-meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 0.4rem;

            .time-text { font-size: 0.75rem; color: var(--color-text); font-weight: 600; }
            .confidence-badge {
              background: var(--color-action);
              color: #ffffff;
              font-size: 0.72rem;
              font-weight: 800;
              padding: 0.15rem 0.4rem;
              border-radius: 4px;
            }
          }
        }
      }

      .empty-roll-call {
        text-align: center;
        padding: 2rem 1rem;
        color: var(--color-muted);
        font-size: 0.9rem;
      }
    }

    /* Student Master Face Profile Card */
    .student-face-profile-card {
      background: var(--color-bg);
      border: 1.5px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 1rem 1.25rem;
      margin-bottom: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;

      .profile-card-left {
        display: flex;
        align-items: center;
        gap: 0.85rem;

        .master-face-avatar {
          width: 56px;
          height: 56px;
          object-fit: cover;
          border-radius: 50%;
          border: 2.5px solid var(--color-accent-bright);
          box-shadow: var(--shadow-card);
        }

        .master-face-empty {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          border: 2px dashed #94A3B8;
        }

        .master-enrolled-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: var(--color-success-bg);
          color: var(--color-accent-bright);
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
        }

        .master-pending-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: #FEF3C7;
          color: #D97706;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.15rem 0.5rem;
          border-radius: var(--radius-lg);
        }

        .profile-student-title {
          margin: 0.25rem 0 0 0;
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--color-text);
        }
      }

      .profile-card-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;

        button, label {
          padding: 0.5rem 0.95rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid var(--color-border);
          background: var(--color-surface);
          color: var(--color-text);
          transition: all 0.2s;

          &:hover {
            background: var(--color-success-bg);
            border-color: var(--color-accent-bright);
          }
        }

        .btn-enroll-live {
          background: var(--color-action);
          color: #ffffff;
          border: none;

          &:hover {
            background: var(--color-action);
          }
        }
      }
    }

    /* Biometric Camera Viewport */
    .biometric-scanner-container {
      margin: 1.5rem 0;

      .camera-viewport-box {
        position: relative;
        width: 100%;
        max-width: 440px;
        height: 320px;
        margin: 0 auto;
        border-radius: 16px;
        overflow: hidden;
        background: #000000;
        box-shadow: var(--shadow-card);

        .camera-video-feed {
          width: 100%;
          height: 100%;
          object-fit: cover;
          &.hidden { display: none; }
        }

        .camera-simulation-mesh {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #071712, var(--color-primary));

          .simulated-face-silhouette {
            font-size: 5rem;
            opacity: 0.7;
          }
        }

        .face-target-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 200px;
          height: 240px;
          border: 2px dashed rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          pointer-events: none;
          transition: all 0.3s;

          &.face-locked {
            border-color: var(--color-accent);
            border-style: solid;
            box-shadow: 0 0 20px rgba(var(--color-accent-rgb), 0.5);
          }

          &.face-mismatch {
            border-color: #EF4444;
            border-style: solid;
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.6);
          }

          .laser-scanner-line {
            position: absolute;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, transparent, var(--color-accent), transparent);
            box-shadow: 0 0 10px var(--color-accent);
            animation: scanMove 2.5s infinite linear;

            &.laser-red {
              background: linear-gradient(90deg, transparent, #EF4444, transparent);
              box-shadow: 0 0 10px #EF4444;
            }
          }
        }
      }
    }

    @keyframes scanMove {
      0% { top: 0%; opacity: 0.3; }
      50% { top: 100%; opacity: 1; }
      100% { top: 0%; opacity: 0.3; }
    }

    .corner-bracket {
      position: absolute;
      width: 14px;
      height: 14px;
      border-color: var(--color-accent);
      border-style: solid;

      &.top-left { top: -6px; left: -6px; border-width: 3px 0 0 3px; }
      &.top-right { top: -6px; right: -6px; border-width: 3px 3px 0 0; }
      &.bottom-left { bottom: -6px; left: -6px; border-width: 0 0 3px 3px; }
      &.bottom-right { bottom: -6px; right: -6px; border-width: 0 3px 3px 0; }
    }

    .camera-status-overlay {
      position: absolute;
      bottom: 12px;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;

      .status-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.35rem 0.85rem;
        border-radius: 20px;
        font-size: 0.78rem;
        font-weight: 700;
        backdrop-filter: blur(8px);
        color: #ffffff;

        &.status-verified { background: rgba(var(--color-accent-rgb), 0.9); }
        &.status-mismatch { background: rgba(239, 68, 68, 0.9); }
        &.status-enrolled { background: rgba(59, 130, 246, 0.9); }
        &.status-scanning { background: rgba(245, 158, 11, 0.9); }
      }
    }

    .pulse-dot-green { width: 8px; height: 8px; border-radius: 50%; background: var(--color-surface); animation: pulse 1.5s infinite; }
    .pulse-dot-red { width: 8px; height: 8px; border-radius: 50%; background: var(--color-surface); animation: pulse 1.5s infinite; }
    .pulse-dot-yellow { width: 8px; height: 8px; border-radius: 50%; background: var(--color-surface); animation: pulse 1.5s infinite; }

    @keyframes pulse {
      0% { opacity: 0.4; transform: scale(0.9); }
      50% { opacity: 1; transform: scale(1.1); }
      100% { opacity: 0.4; transform: scale(0.9); }
    }

    .camera-controls-bar {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      margin-top: 0.75rem;

      button {
        flex: 1;
        padding: 0.6rem 1rem;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
        border: 1px solid var(--color-border);
        background: var(--color-bg);
        color: var(--color-text);
        transition: all 0.2s;

        &.btn-verify-face {
          background: var(--color-action);
          color: #ffffff;
          border: none;
        }
      }
    }

    .biometric-feedback-notice {
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.88rem;
      margin-bottom: 1.25rem;
      font-weight: 600;

      &.notice-matched {
        background: rgba(var(--color-accent-rgb), 0.1);
        border: 1.5px solid var(--color-accent);
        color: #065F46;
      }
      &.notice-mismatch {
        background: rgba(239, 68, 68, 0.1);
        border: 1.5px solid #EF4444;
        color: var(--color-error);
      }
      &.notice-enrolled {
        background: rgba(59, 130, 246, 0.1);
        border: 1.5px solid #3B82F6;
        color: #1E40AF;
      }
      &.notice-scanning {
        background: var(--color-bg);
        border: 1px solid var(--color-border);
        color: var(--color-muted);
      }
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.25rem;
      @media (max-width: 650px) { grid-template-columns: 1fr; }
    }

    .form-group {
      min-width: 0;
      margin-bottom: 1.25rem;
      label { display: block; font-size: 0.85rem; font-weight: 700; margin-bottom: 0.35rem; color: var(--color-text); }
      .form-control { width: 100%; padding: 0.75rem 1rem; border-radius: 8px; border: 1.5px solid var(--color-border); font-size: 0.95rem; }
    }

    .btn-checkin {
      width: 100%;
      background: var(--color-action);
      color: white;
      border: none;
      padding: 0.95rem 1.5rem;
      border-radius: 10px;
      font-weight: 800;
      font-size: 1.05rem;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-card);

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    /* Verified Success Card */
    .verified-success-card {
      background: var(--color-bg);
      border: 2px solid var(--color-accent-bright);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      margin-top: 1rem;

      .success-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--color-border);
        .success-icon { font-size: 2rem; }
        h4 { margin: 0; font-size: 1.15rem; font-weight: 800; }
        p { margin: 0.2rem 0 0 0; color: var(--color-muted); font-size: 0.85rem; }
      }

      .success-details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 0.75rem;
        font-size: 0.9rem;
        margin-bottom: 1.25rem;

        .badge-present { background: var(--color-success-bg); color: var(--color-accent); padding: 0.2rem 0.5rem; border-radius: 6px; font-weight: 700; }
        .badge-match { background: var(--color-action); color: #ffffff; padding: 0.2rem 0.5rem; border-radius: 6px; font-weight: 700; }
      }

      .side-by-side-proof {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        margin: 1.25rem 0;

        .proof-photo-item {
          text-align: center;
          .proof-label { display: block; font-size: 0.8rem; font-weight: 700; margin-bottom: 0.4rem; color: var(--color-text); }
          .proof-img {
            width: 120px;
            height: 120px;
            object-fit: cover;
            border-radius: var(--radius-lg);
            border: 2px solid var(--color-border);

            &.live-ring {
              border-color: var(--color-accent-bright);
              box-shadow: var(--shadow-card);
            }
          }
        }
      }

      .btn-checkin-another {
        width: 100%;
        padding: 0.75rem;
        border-radius: 8px;
        border: 1.5px solid var(--color-border);
        background: var(--color-surface);
        font-weight: 700;
        cursor: pointer;
      }
    }

    .select-prompt {
      text-align: center;
      padding: 3rem 1.5rem;
      color: var(--color-muted);
      .prompt-icon { font-size: 3rem; display: block; margin-bottom: 0.5rem; }
    }
  `]
})
export class QrAttendanceComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;

  classGroups = signal<ClassGroupDto[]>([]);
  students = signal<StudentDto[]>([]);
  qrSession = signal<QrSessionDto | null>(null);
  viewMode = signal<'projector' | 'scanner'>('projector');
  cameraActive = signal<boolean>(false);
  checkingIn = signal<boolean>(false);
  selectedClassGroupId = '';

  selectedStudent = signal<StudentDto | null>(null);
  biometricStatus = signal<'SCANNING' | 'MATCHED' | 'MISMATCH' | 'ENROLLED'>('SCANNING');
  biometricConfidence = signal<number>(0);
  identityMatched = signal(false);
  matchingFace = signal(false);
  biometricNotice = signal<string>('Start your camera, center your face, then start the camera check.');
  liveDescriptorJson = signal<string>('');

  capturedSnapshot = signal<string | null>(null);
  verifiedResult = signal<any | null>(null);
  liveAttendees = signal<LiveAttendeeDto[]>([]);

  private mediaStream: MediaStream | null = null;
  private pollTimer: any = null;
  private faceScanInterval: any = null;

  scannerForm = {
    studentId: '',
    classGroupId: '',
    qrNonce: '',
    faceVerified: false,
    faceSnapshotBase64: '',
    faceMatchConfidence: 0,
    faceDescriptorJson: ''
  };

  auth = inject(AuthService);
  canManage = () => this.auth.isAdmin() || this.auth.isTeacher();
  livenessComplete = signal(false);
  startingChallenge = signal(false);
  challengeSeconds = signal(0);
  qrImage = signal('');
  private check: LivenessCheck | null = null;
  private checkStarted = 0;
  private deadline = 0;
  private revision = 0;
  private scanning = false;
  private destroyed = false;
  private cameraStarting = false;
  private qrService = inject(QrAttendanceService);
  private courseService = inject(CourseService);
  private studentService = inject(StudentService);
  private faceService = inject(FaceRecognitionService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    if (!this.canManage()) this.viewMode.set('scanner');
    this.faceService.loadModels().catch(() => {});

    this.courseService.getClassGroups().subscribe((res: ClassGroupDto[]) => {
      this.classGroups.set(res);
      if (res.length > 0) {
        this.selectedClassGroupId = res[0].id;
        if (this.canManage()) this.onGroupSelected();
      }
    });

    this.studentService.getStudents().subscribe((res: StudentDto[]) => {
      res = this.canManage() ? res : res.filter(s => s.userId === this.auth.currentUser()?.userId || s.id === this.auth.currentUser()?.userId);
      this.students.set(res);
      if (res.length > 0) {
        this.scannerForm.studentId = res[0].id;
        this.onStudentSelected();
      }
    });

    // Start live roll-call polling for the projector screen
    this.pollTimer = setInterval(() => {
      if (this.canManage() && this.viewMode() === 'projector' && this.selectedClassGroupId) {
        this.loadLiveAttendees();
      }
    }, 4000);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.stopCamera();
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.faceScanInterval) clearInterval(this.faceScanInterval);
  }

  onStudentSelected(): void {
    this.invalidateCheck();
    const s = this.students().find(item => item.id === this.scannerForm.studentId || item.studentId === this.scannerForm.studentId);
    this.selectedStudent.set(s || null);
    this.biometricStatus.set('SCANNING');
    this.biometricNotice.set('Align face in frame to match against ' + (s ? s.firstName + ' ' + s.lastName : 'selected profile') + '.');
  }

  loadLiveAttendees(): void {
    if (!this.selectedClassGroupId) return;
    this.qrService.getLiveAttendees(this.selectedClassGroupId).subscribe({
      next: (res) => this.liveAttendees.set(res),
      error: () => {}
    });
  }

  setViewMode(mode: 'projector' | 'scanner'): void {
    if (mode === 'projector' && !this.canManage()) return;
    this.viewMode.set(mode);
    if (mode === 'scanner') {
      this.startCamera();
    } else {
      this.stopCamera();
      this.loadLiveAttendees();
    }
  }

  qrImageUrl(): string { return this.qrImage(); }

  onGroupSelected(refresh = false): void {
    if (!this.selectedClassGroupId) return;
    const groupId = this.selectedClassGroupId;
    this.qrService.generateSessionQr(groupId, refresh).subscribe({
      next: (res) => {
        if (this.destroyed || groupId !== this.selectedClassGroupId) return;
        this.invalidateCheck();
        this.qrSession.set(res);
        QRCode.toDataURL(JSON.stringify({ classGroupId: res.classGroupId, qrNonce: res.qrNonce }), { width: 240, margin: 2 })
          .then(url => { if (this.qrSession() === res) this.qrImage.set(url); })
          .catch(() => this.toastService.show('Could not draw the QR code. Use the displayed token.', 'error'));
        this.scannerForm.qrNonce = res.qrNonce;
        this.scannerForm.classGroupId = res.classGroupId;
        this.loadLiveAttendees();
      },
      error: (err) => this.toastService.show(err.error?.message || 'Could not create classroom QR.', 'error')
    });
  }

  useNonceForScanner(): void {
    const session = this.qrSession();
    if (session) {
      this.scannerForm.qrNonce = session.qrNonce;
      this.scannerForm.classGroupId = session.classGroupId;
    }
    this.setViewMode('scanner');
    this.toastService.show('QR Nonce loaded into scanner! Align face to check in.', 'success');
  }

  invalidateCheck(message = 'Start the camera check when you are ready.'): void {
    this.revision++;
    this.check = null;
    this.livenessComplete.set(false);
    this.startingChallenge.set(false);
    this.challengeSeconds.set(0);
    this.liveDescriptorJson.set('');
    this.biometricConfidence.set(0);
    this.identityMatched.set(false);
    this.matchingFace.set(false);
    this.biometricStatus.set('SCANNING');
    this.biometricNotice.set(message);
  }

  async startCamera(): Promise<void> {
    if (this.cameraStarting || this.cameraActive() || this.destroyed) return;
    this.cameraStarting = true;
    const revision = this.revision;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera unavailable');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
      if (this.destroyed || this.viewMode() !== 'scanner' || revision !== this.revision) {
        stream.getTracks().forEach(t => t.stop()); return;
      }
      this.mediaStream = stream;
      this.cameraActive.set(true);
      const video = this.videoElement?.nativeElement;
      if (!video) throw new Error('Camera view unavailable');
      video.srcObject = stream;
      await video.play();
      if (this.destroyed || this.mediaStream !== stream) return;
      stream.getVideoTracks().forEach(t => t.addEventListener('ended', () => this.stopCamera()));
      this.startFaceVerificationLoop();
    } catch {
      this.stopCamera();
      this.biometricNotice.set('Camera unavailable. Allow camera access and retry, or ask your teacher to mark attendance manually.');
    } finally { this.cameraStarting = false; }
  }

  stopCamera(): void {
    this.invalidateCheck('Camera stopped. Restart it to complete a new check.');
    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.mediaStream = null;
    if (this.faceScanInterval) clearInterval(this.faceScanInterval);
    this.faceScanInterval = null;
    this.cameraActive.set(false);
  }

  toggleCamera(): void { if (this.cameraActive()) this.stopCamera(); else void this.startCamera(); }

  refreshScannerToken(retry = false): void {
    if (!this.canManage() || !this.scannerForm.classGroupId) return;
    this.invalidateCheck('Getting the current classroom token…');
    const revision = this.revision;
    const groupId = this.scannerForm.classGroupId;
    this.startingChallenge.set(true);
    this.qrService.generateSessionQr(groupId).subscribe({
      next: session => {
        if (this.destroyed || revision !== this.revision || groupId !== this.scannerForm.classGroupId) return;
        this.scannerForm.qrNonce = session.qrNonce;
        if (this.selectedClassGroupId === groupId) {
          this.qrSession.set(session);
          QRCode.toDataURL(JSON.stringify({ classGroupId: session.classGroupId, qrNonce: session.qrNonce }), { width: 240, margin: 2 })
            .then(url => { if (this.qrSession() === session) this.qrImage.set(url); })
            .catch(() => this.qrImage.set(''));
        }
        this.startingChallenge.set(false);
        this.biometricNotice.set('Current classroom token loaded. Start the camera check.');
        if (retry) this.startLivenessCheck(false);
      },
      error: err => {
        if (revision === this.revision) this.invalidateCheck(err.error?.message || 'Could not retrieve this class token. Ask the assigned teacher to refresh the classroom QR.');
      }
    });
  }

  startLivenessCheck(recoverToken = true): void {
    this.invalidateCheck();
    if (!this.cameraActive() || !this.selectedStudent()?.faceDescriptorJson) {
      this.biometricNotice.set('Start the camera and use a profile enrolled by an administrator. Your teacher can help with manual attendance.');
      return;
    }
    if (!this.scannerForm.classGroupId || !this.scannerForm.qrNonce.trim()) {
      this.biometricNotice.set('Choose your class group and enter its current QR token first.'); return;
    }
    const revision = this.revision;
    this.startingChallenge.set(true);
    this.qrService.startChallenge(this.scannerForm.studentId, this.scannerForm.classGroupId, this.scannerForm.qrNonce.trim()).subscribe({
      next: challenge => {
        if (revision !== this.revision || this.destroyed) return;
        this.startingChallenge.set(false);
        try {
          this.check = new LivenessCheck(challenge, JSON.parse(this.selectedStudent()!.faceDescriptorJson!));
          this.matchingFace.set(true);
          this.checkStarted = performance.now();
          this.deadline = this.checkStarted + Math.min(60000, Date.parse(challenge.expiresAt) - Date.parse(challenge.issuedAt));
          this.biometricNotice.set(this.check.instruction);
        } catch { this.invalidateCheck('Face profile is invalid. Ask an administrator to enroll it again.'); }
      },
      error: err => {
        if (revision !== this.revision) return;
        if (recoverToken && this.canManage() && err.error?.code === 'QR_SESSION_INVALID') {
          this.refreshScannerToken(true);
          return;
        }
        this.invalidateCheck(err.error?.message || 'Could not start the check. Check your enrollment and classroom token, then retry.');
      }
    });
  }

  startFaceVerificationLoop(): void {
    if (this.faceScanInterval) clearInterval(this.faceScanInterval);
    this.faceScanInterval = setInterval(() => {
      if (this.check) {
        this.challengeSeconds.set(Math.max(0, Math.ceil((this.deadline - performance.now()) / 1000)));
        if (performance.now() >= this.deadline) { this.invalidateCheck('Camera check expired. Start a new check.'); return; }
      }
      void this.scanAndVerifyFace();
    }, 200);
  }

  async scanAndVerifyFace(): Promise<void> {
    if (this.scanning || !this.check || this.checkingIn() || !this.cameraActive() || !this.videoElement?.nativeElement) return;
    const check = this.check;
    const revision = this.revision;
    this.scanning = true;
    try {
      const detection = await this.faceService.extractFaceDescriptor(this.videoElement.nativeElement);
      if (revision !== this.revision) return;
      if (!detection) throw new Error('Keep exactly one face in the camera. Start the check again.');
      if (performance.now() >= this.deadline) throw new Error('Camera check expired. Start again.');
      check.add({ at: performance.now() - this.checkStarted, eye: detection.eye, yaw: detection.yaw, descriptor: detection.descriptorArray });
      this.biometricConfidence.set(check.similarityPercent ?? 0);
      this.identityMatched.set(check.identityMatched);
      this.matchingFace.set(!check.identityMatched);
      this.liveDescriptorJson.set(JSON.stringify(detection.descriptorArray));
      this.livenessComplete.set(check.complete && check.samples.at(-1)!.at >= 1500);
      this.biometricStatus.set(this.livenessComplete() ? 'MATCHED' : 'SCANNING');
      this.biometricNotice.set(check.instruction);
    } catch (err) {
      if (revision === this.revision) this.invalidateCheck(err instanceof Error ? err.message : 'Camera check failed. Please retry.');
    } finally { this.scanning = false; }
  }

  captureSelfieSnapshot(): string | null {
    if (this.videoElement && this.videoElement.nativeElement && this.cameraActive()) {
      const video = this.videoElement.nativeElement;
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.85);
      }
    }
    return null;
  }

  resetVerification(): void {
    this.verifiedResult.set(null);
    this.capturedSnapshot.set(null);
    this.invalidateCheck();
    void this.startCamera();
  }

  async enrollCurrentFaceAsMaster(): Promise<void> {
    if (!this.auth.isAdmin()) return;
    this.invalidateCheck();
    const student = this.selectedStudent();
    if (!student) {
      this.toastService.show('Please select a student profile first.', 'error');
      return;
    }

    const photoBase64 = this.captureSelfieSnapshot();
    if (!photoBase64) {
      this.toastService.show('Please start the camera to capture a face photo.', 'info');
      return;
    }

    try {
      if (!this.videoElement?.nativeElement) return;
      const detection = await this.faceService.extractFaceDescriptor(this.videoElement.nativeElement);
      if (!detection) {
        this.toastService.show('No face detected in camera. Please align face in frame.', 'error');
        return;
      }

      const descriptorJson = JSON.stringify(detection.descriptorArray);
      this.studentService.enrollFace(student.id, photoBase64, descriptorJson).subscribe({
        next: () => {
          student.profilePhotoUrl = photoBase64;
          student.faceDescriptorJson = descriptorJson;
          this.selectedStudent.set({ ...student });
          this.invalidateCheck('Face enrolled. Start a new camera check.');
          this.biometricNotice.set(` Master Face Profile Enrolled for ${student.firstName}! Real-time 1:1 matching is now active.`);
          this.toastService.show(` Master Face ID Enrolled for ${student.firstName} ${student.lastName}!`, 'success');
        },
        error: (err) => {
          this.toastService.show(err.error?.message || 'Failed to save biometric profile.', 'error');
        }
      });
    } catch {
      this.toastService.show('Error extracting face descriptor.', 'error');
    }
  }

  async onUploadMasterFace(event: any): Promise<void> {
    if (!this.auth.isAdmin()) return;
    this.invalidateCheck();
    const student = this.selectedStudent();
    if (!student) {
      this.toastService.show('Please select a student profile first.', 'error');
      return;
    }

    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const photoBase64 = e.target.result;
        const img = new Image();
        img.src = photoBase64;
        img.onload = async () => {
          try {
            const detection = await this.faceService.extractFaceDescriptor(img);
            if (detection) {
              const descriptorJson = JSON.stringify(detection.descriptorArray);
              this.studentService.enrollFace(student.id, photoBase64, descriptorJson).subscribe({
                next: () => {
                  student.profilePhotoUrl = photoBase64;
                  student.faceDescriptorJson = descriptorJson;
                  this.selectedStudent.set({ ...student });
                  this.invalidateCheck('Face enrolled. Start a new camera check.');
                  this.toastService.show(` Master Face ID Enrolled for ${student.firstName} ${student.lastName}!`, 'success');
                },
                error: (err) => {
                  this.toastService.show(err.error?.message || 'Failed to save biometric profile.', 'error');
                }
              });
            } else {
              this.toastService.show('No clear face detected in uploaded photo. Please use a clear portrait.', 'error');
            }
          } catch {
            this.toastService.show('Error extracting face descriptor from image.', 'error');
          }
        };
      };
      reader.readAsDataURL(file);
    }
  }

  biometricStatusClass(): string {
    const st = this.biometricStatus();
    if (st === 'MATCHED') return 'notice-matched';
    if (st === 'MISMATCH') return 'notice-mismatch';
    if (st === 'ENROLLED') return 'notice-enrolled';
    return 'notice-scanning';
  }

  onScanSubmit(): void {
    const check = this.check;
    const last = check?.samples.at(-1);
    if (this.checkingIn() || !this.cameraActive() || !this.livenessComplete() || !check || !last ||
        performance.now() >= this.deadline || performance.now() - this.checkStarted - last.at > 2000) {
      this.invalidateCheck('Complete a fresh camera check before submitting attendance.'); return;
    }
    const selfie = this.captureSelfieSnapshot();
    if (!selfie) { this.invalidateCheck('Camera snapshot unavailable. Please retry.'); return; }
    this.capturedSnapshot.set(selfie);
    this.checkingIn.set(true);
    this.qrService.scanCheckIn({ ...this.scannerForm, qrNonce: this.scannerForm.qrNonce.trim(), faceSnapshotBase64: selfie,
      challengeId: check.challenge.id, samples: [...check.samples] }).subscribe({
      next: res => {
        this.checkingIn.set(false);
        this.verifiedResult.set(res);
        this.stopCamera();
        this.toastService.show(res.message || 'Attendance recorded.', 'success');
      },
      error: err => {
        this.checkingIn.set(false);
        this.invalidateCheck(err.error?.message || 'Check-in failed. Start a new camera check.');
      }
    });
  }
}
