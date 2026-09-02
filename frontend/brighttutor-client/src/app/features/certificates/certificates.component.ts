import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CertificateService, CertificateDto, EligibilityResultDto, TeacherEligibilityResultDto } from '../../services/certificate.service';
import { StudentService, StudentDto } from '../../services/student.service';
import { TeacherService, TeacherDto } from '../../services/teacher.service';
import { CourseService, CourseDto } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-certificates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="certificates-page">
      <div class="page-header">
        <h1>📜 Official Digital Certificates</h1>
        <p>Bright Tutorial Center Academic Completion & Teacher Service Recognition Portal.</p>
      </div>

      <!-- ADMIN VIEW: Full Control Panel -->
      @if (authService.isAdmin() || authService.isSuperAdmin()) {
        <!-- Action Panel: Student Eligibility Evaluator -->
        <div class="evaluator-card">
          <h3>🎓 Student 3-Month Course Completion Evaluator</h3>
          <p class="rule-hint">Rule: Must complete 3-Month curriculum timeline (&ge;90 days) with &lt;20.0% absences (&ge;80% attendance rate).</p>

          <div class="eval-form-row">
            <div class="form-group">
              <label>Select Student *</label>
              <select [(ngModel)]="selectedStudentId" name="selectedStudentId">
                <option value="">-- Choose Student --</option>
                @for (student of students(); track student.id) {
                  <option [value]="student.id">{{ student.firstName }} {{ student.lastName }} ({{ student.studentCode }})</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label>Select Course *</label>
              <select [(ngModel)]="selectedCourseId" name="selectedCourseId">
                <option value="">-- Choose Course --</option>
                @for (course of courses(); track course.id) {
                  <option [value]="course.id">{{ course.name }}</option>
                }
              </select>
            </div>

            <div class="btn-group">
              <button type="button" class="btn-check" (click)="onCheckEligibility()">Check Eligibility</button>
            </div>
          </div>

          @if (eligibility()) {
            <div class="eligibility-result" [class.eligible]="eligibility()?.isEligible" [class.ineligible]="!eligibility()?.isEligible">
              <h4>{{ eligibility()?.statusMessage }}</h4>
              <div class="metrics-grid">
                <div><strong>Student:</strong> {{ eligibility()?.studentName }}</div>
                <div><strong>Course:</strong> {{ eligibility()?.courseName }}</div>
                <div><strong>Days Enrolled:</strong> {{ eligibility()?.daysEnrolled }} / 90 days</div>
                <div><strong>Attendance Rate:</strong> {{ eligibility()?.attendancePercentage }}% (&ge;80% required)</div>
              </div>

              @if (eligibility()?.isEligible) {
                <button type="button" class="btn-issue" (click)="onIssueStudentCert()">🎉 Issue Student Certificate</button>
              }
            </div>
          }
        </div>

        <!-- Action Panel: Teacher Service Excellence Generator -->
        <div class="evaluator-card teacher-card">
          <h3>👨‍🏫 Teacher 1-Year Service Excellence Certificate</h3>
          <p class="rule-hint">Rule: Must complete 1 full year (365 days) of active teaching service.</p>
          <div class="eval-form-row">
            <div class="form-group flex-1">
              <label>Select Educator *</label>
              <select [(ngModel)]="selectedTeacherId" name="selectedTeacherId">
                <option value="">-- Choose Educator --</option>
                @for (teacher of teachers(); track teacher.id) {
                  <option [value]="teacher.id">{{ teacher.firstName }} {{ teacher.lastName }} ({{ teacher.specialization }})</option>
                }
              </select>
            </div>
            <div class="btn-group">
              <button type="button" class="btn-check" (click)="onCheckTeacherEligibility()">Check 1-Year Service</button>
            </div>
          </div>

          @if (teacherEligibility()) {
            <div class="eligibility-result" [class.eligible]="teacherEligibility()?.isEligible" [class.ineligible]="!teacherEligibility()?.isEligible">
              <h4>{{ teacherEligibility()?.statusMessage }}</h4>
              <div class="metrics-grid">
                <div><strong>Educator:</strong> {{ teacherEligibility()?.teacherName }}</div>
                <div><strong>Specialization:</strong> {{ teacherEligibility()?.specialization }}</div>
                <div><strong>Days in Service:</strong> {{ teacherEligibility()?.daysInService }} / 365 days</div>
              </div>

              @if (teacherEligibility()?.isEligible) {
                <button type="button" class="btn-issue-tch" (click)="onIssueTeacherCert()">🏆 Issue 1-Year Service Certificate</button>
              }
            </div>
          }
        </div>
      }

      <!-- TEACHER VIEW: Personal 1-Year Service Certificate Only -->
      @if (authService.isTeacher()) {
        <div class="evaluator-card teacher-card">
          <h3>🏆 My 1-Year Teaching Service Certificate</h3>
          <p class="rule-hint">Official Service Recognition awarded after completing 1 full year (365 days) of active service at Bright Tutorial Center.</p>

          @if (myTeacherStatus()) {
            <div class="status-box" [class.status-passed]="myTeacherStatus()?.isEligible" [class.status-pending]="!myTeacherStatus()?.isEligible">
              <div class="status-title">{{ myTeacherStatus()?.statusMessage }}</div>
              <div class="progress-bar-wrap">
                <div class="progress-bar-fill" [style.width.%]="getTeacherProgressPercent()"></div>
              </div>
              <div class="progress-meta">
                <span>Active Days Served: <strong>{{ myTeacherStatus()?.daysInService }}</strong> / 365 Days</span>
                <span>Requirement: 1 Full Year</span>
              </div>

              @if (myTeacherStatus()?.isEligible) {
                <button type="button" class="btn-claim-cert" (click)="onClaimTeacherCert()">📜 View / Print My 1-Year Certificate</button>
              }
            </div>
          } @else {
            <button type="button" class="btn-check" (click)="loadMyTeacherCertificateStatus()">Check My Service Status</button>
          }
        </div>
      }

      <!-- STUDENT VIEW: Personal 3-Month Completion Certificate Only -->
      @if (authService.isStudent()) {
        <div class="evaluator-card">
          <h3>🎓 My 3-Month Course Completion Certificate</h3>
          <p class="rule-hint">Awarded upon completing your 3-Month course timeline with &ge;80% attendance rate.</p>

          @if (myStudentStatus()) {
            <div class="status-box" [class.status-passed]="myStudentStatus()?.isEligible" [class.status-pending]="!myStudentStatus()?.isEligible">
              <div class="status-title">{{ myStudentStatus()?.statusMessage }}</div>
              <div class="progress-meta">
                <span>Attendance Rate: <strong>{{ myStudentStatus()?.attendancePercentage }}%</strong> (&ge;80% required)</span>
                <span>Days Enrolled: <strong>{{ myStudentStatus()?.daysEnrolled }}</strong> / 90 Days</span>
              </div>

              @if (myStudentStatus()?.isEligible) {
                <button type="button" class="btn-claim-cert" (click)="onClaimStudentCert()">📜 View / Print My Certificate</button>
              }
            </div>
          } @else {
            <p>Select your enrolled course to verify certificate status:</p>
            <div class="eval-form-row">
              <div class="form-group">
                <select [(ngModel)]="selectedCourseId" name="selectedCourseId">
                  <option value="">-- Choose Course --</option>
                  @for (course of courses(); track course.id) {
                    <option [value]="course.id">{{ course.name }}</option>
                  }
                </select>
              </div>
              <button type="button" class="btn-check" (click)="loadMyStudentCertificateStatus()">Check Status</button>
            </div>
          }
        </div>
      }

      <!-- ELEGANT LANDSCAPE DIPLOMA OF EXCELLENCE MODAL -->
      @if (activeCertificate()) {
        <div class="cert-modal-overlay" (click)="activeCertificate.set(null)">
          <div class="cert-frame-wrapper" (click)="$event.stopPropagation()">
            
            <!-- THE DIPLOMA FRAME (PRINT / CANVAS AREA) -->
            <div id="certFrameToDownload" class="cert-frame-landscape">
              <!-- Top-Right Close Button -->
              <button type="button" class="close-top-right-btn no-print" (click)="activeCertificate.set(null)" title="Close Window">✕</button>

              <div class="cert-landscape-inner">
                <!-- Corner Golden Filigree Ornaments -->
                <div class="corner corner-tl"></div>
                <div class="corner corner-tr"></div>
                <div class="corner corner-bl"></div>
                <div class="corner corner-br"></div>

              <!-- Header with Official Emblem & Title -->
              <div class="cert-header-landscape">
                <div class="header-logo-container">
                  <div class="official-emblem-badge">
                    <img [src]="logoBase64()" alt="Bright Tutorial Center" class="official-logo-img" />
                  </div>
                  <div class="header-titles">
                    <div class="institution-title">BRIGHT TUTORIAL CENTER</div>
                    <div class="institution-subtitle">CENTER FOR EDUCATIONAL EXCELLENCE & ACADEMIC LEADERSHIP</div>
                  </div>
                </div>
              </div>

              <!-- Diploma Title Ribbon -->
              <div class="cert-ribbon-banner">
                <span>OFFICIAL DIPLOMA OF {{ activeCertificate()?.type === 2 ? 'PROFESSIONAL TEACHING EXCELLENCE' : 'ACADEMIC COURSE COMPLETION' }}</span>
              </div>

              <!-- Main Certificate Body -->
              <div class="cert-body-landscape">
                <p class="award-lead">This official certificate is proudly awarded to</p>
                <h1 class="recipient-name-calligraphy">{{ activeCertificate()?.recipientName }}</h1>
                <p class="cert-description-text">{{ activeCertificate()?.description }}</p>

                <div class="cert-details-pills">
                  <div class="detail-pill">
                    <span class="pill-label">TIMELINE / DURATION</span>
                    <span class="pill-value">{{ activeCertificate()?.timelineDuration }}</span>
                  </div>
                  <div class="detail-pill">
                    <span class="pill-label">SPECIALIZATION / COURSE</span>
                    <span class="pill-value">{{ activeCertificate()?.skillsLearned }}</span>
                  </div>
                  <div class="detail-pill">
                    <span class="pill-label">ACADEMIC STANDING</span>
                    <span class="pill-value">Attendance Rate: {{ activeCertificate()?.attendancePercentage || 95 }}%</span>
                  </div>
                </div>
              </div>

              <!-- Footer: Signatures, Circular Die-Cut Logo Stamp Seal, and Serial Info -->
              <div class="cert-footer-landscape">
                <!-- Left Signature: Board Director -->
                <div class="signature-box">
                  <div class="calligraphy-sig">Munir Nesru</div>
                  <div class="signature-line"></div>
                  <div class="signer-name">Munir Nesru</div>
                  <div class="signer-title">Academic Board Director</div>
                  <div class="signer-org">Bright Tutorial Center</div>
                </div>

                <!-- Center Official 3D Golden Embossed Stamp Seal (HTML Image Overlay for 100% Canvas Support) -->
                <div class="stamp-box">
                  <div class="html-stamp-container">
                    <svg viewBox="0 0 160 160" class="html-stamp-svg-ring">
                      <defs>
                        <linearGradient id="goldGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="#bf953f"/>
                          <stop offset="25%" stop-color="#fcf6ba"/>
                          <stop offset="50%" stop-color="#b38728"/>
                          <stop offset="75%" stop-color="#fbf5b7"/>
                          <stop offset="100%" stop-color="#aa771c"/>
                        </linearGradient>
                      </defs>

                      <!-- Golden Ribbon Tails extending below seal -->
                      <path d="M 55,115 L 45,152 L 62,142 L 72,118 Z" fill="url(#goldGrad2)"/>
                      <path d="M 105,115 L 115,152 L 98,142 L 88,118 Z" fill="url(#goldGrad2)"/>

                      <!-- Scalloped Gold Teeth Outer Ring -->
                      <circle cx="80" cy="80" r="76" fill="none" stroke="url(#goldGrad2)" stroke-width="3" stroke-dasharray="5 3"/>
                      
                      <!-- Main Stamp Body -->
                      <circle cx="80" cy="80" r="70" fill="#233215" stroke="url(#goldGrad2)" stroke-width="2.5"/>
                      <circle cx="80" cy="80" r="58" fill="none" stroke="url(#goldGrad2)" stroke-width="1.5" stroke-dasharray="4 2"/>

                      <!-- Curved Top Text -->
                      <path id="stampArcTop2" d="M 28,80 A 52,52 0 1,1 132,80" fill="none"/>
                      <text font-size="8.5" font-weight="900" fill="#fcf6ba" letter-spacing="1.6">
                        <textPath href="#stampArcTop2" startOffset="50%" text-anchor="middle">BRIGHT TUTORIAL CENTER</textPath>
                      </text>

                      <!-- Curved Bottom Text -->
                      <path id="stampArcBottom2" d="M 132,80 A 52,52 0 0,1 28,80" fill="none"/>
                      <text font-size="7.8" font-weight="800" fill="url(#goldGrad2)" letter-spacing="1.3">
                        <textPath href="#stampArcBottom2" startOffset="50%" text-anchor="middle">★ OFFICIAL SEAL OF EXCELLENCE ★</textPath>
                      </text>

                      <!-- Inner Gold Ring -->
                      <circle cx="80" cy="80" r="34" fill="url(#goldGrad2)" stroke="#233215" stroke-width="1"/>
                      <clipPath id="stampClip">
                        <circle cx="80" cy="80" r="32"/>
                      </clipPath>
                      <image [attr.href]="logoBase64()" x="48" y="48" width="64" height="64" clip-path="url(#stampClip)" preserveAspectRatio="xMidYMid slice"/>
                    </svg>

                    <!-- HTML Image Badge in Stamp Center (100% Reliable HTML Canvas Rendering) -->
                    <div class="stamp-html-logo-circle">
                      <img [src]="logoBase64()" alt="Stamp Emblem" class="stamp-html-logo-img" />
                    </div>
                  </div>
                  <div class="stamp-serial-info">
                    <span class="serial-code">Serial: {{ activeCertificate()?.serialNumber }}</span>
                    <span class="issue-date-text">Issued: {{ activeCertificate()?.issueDate | date:'longDate' }}</span>
                  </div>
                </div>

                <!-- Right Signature: Education Director -->
                <div class="signature-box">
                  <div class="calligraphy-sig">Rihana Jemal</div>
                  <div class="signature-line"></div>
                  <div class="signer-name">Rihana Jemal</div>
                  <div class="signer-title">Director of Education</div>
                  <div class="signer-org">Bright Tutorial Center</div>
                </div>
              </div>
            </div>
          </div>

          <!-- SINGLE PROMINENT DOWNLOAD TOOLBAR AT BOTTOM -->
          <div class="prominent-action-bar bottom-bar no-print">
            <div class="action-buttons-flex center-actions">
              <button type="button" class="btn-action-gold lg" (click)="downloadCertificatePdf()">
                📥 Download PDF Certificate
              </button>
              <button type="button" class="btn-action-green lg" (click)="downloadCertificatePng()">
                🖼️ Download PNG Image
              </button>
              <button type="button" class="btn-action-outline lg" (click)="printCertificate()">
                🖨️ Print / Save PDF
              </button>
              <button type="button" class="btn-action-close lg" (click)="activeCertificate.set(null)">
                ✕ Close
              </button>
            </div>
          </div>

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .certificates-page { padding: 1.5rem; }
    .page-header h1 { color: #364522; margin-bottom: 0.25rem; font-size: 1.75rem; font-weight: 800; }
    .page-header p { color: var(--color-muted); margin-bottom: 1.5rem; }

    .evaluator-card { background: var(--color-surface); border: 1px solid var(--color-border); padding: 1.5rem; border-radius: 14px; box-shadow: var(--shadow-card); margin-bottom: 1.5rem; }
    .evaluator-card h3 { margin: 0 0 0.25rem 0; color: var(--color-text); font-size: 1.2rem; }
    .rule-hint { font-size: 0.85rem; color: var(--color-muted); margin-bottom: 1rem; }

    .eval-form-row { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; min-width: 220px; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
    .form-group select { padding: 0.65rem; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); font-size: 0.9rem; }

    .btn-check { background: #364522; color: #fff; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-check:hover { background: #232f15; }
    .btn-issue { background: #364522; color: #fff; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 0.75rem; }
    .btn-issue-tch { background: #4a5c2f; color: #fff; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 0.75rem; }
    .btn-claim-cert { background: #364522; color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: 1rem; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 0.5rem; }

    .eligibility-result { margin-top: 1.25rem; padding: 1.25rem; border-radius: 10px; }
    .eligibility-result.eligible { background: #f4f7f0; border: 1px solid #364522; color: #232f15; }
    .eligibility-result.ineligible { background: #fef2f2; border: 1px solid #ef4444; color: #991b1b; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; font-size: 0.88rem; margin-top: 0.5rem; }

    .status-box { padding: 1.25rem; border-radius: 12px; margin-top: 1rem; }
    .status-passed { background: #f4f7f0; border: 1px solid #364522; color: #232f15; }
    .status-pending { background: #fffbebfb; border: 1px solid #f59e0b; color: #b45309; }
    .status-title { font-weight: 700; font-size: 1rem; margin-bottom: 0.75rem; }
    .progress-bar-wrap { background: #e5e7eb; height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 0.5rem; }
    .progress-bar-fill { background: #364522; height: 100%; transition: width 0.3s ease; }
    .progress-meta { display: flex; justify-content: space-between; font-size: 0.85rem; }

    /* ============================================================== */
    /* LUXURY LANDSCAPE DIPLOMA DESIGN WITH EXACT PUZZLE LOGO STAMP  */
    /* ============================================================== */
    /* ============================================================== */
    /* LUXURY LANDSCAPE DIPLOMA DESIGN & PROMINENT DOWNLOAD TOOLBARS  */
    /* ============================================================== */
    .cert-modal-overlay { 
      position: fixed; 
      inset: 0; 
      background: rgba(15, 22, 10, 0.94); 
      backdrop-filter: blur(12px); 
      display: flex; 
      flex-direction: column;
      align-items: center; 
      justify-content: flex-start; 
      z-index: 2000; 
      padding: 1.25rem 1rem; 
      overflow-y: auto; 
    }

    .cert-frame-wrapper {
      width: 100%;
      max-width: 1060px;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      position: relative;
    }
    
    .prominent-action-bar {
      position: sticky;
      top: 0;
      z-index: 2050;
      background: linear-gradient(135deg, #1c2911 0%, #0d1607 100%);
      border: 2px solid #d4af37;
      border-radius: 10px;
      padding: 0.85rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 12px 30px rgba(0,0,0,0.6);
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .prominent-action-bar.bottom-bar {
      position: static;
      justify-content: center;
      margin-top: 0.5rem;
    }

    .action-title-tag {
      color: #d4af37;
      font-weight: 800;
      font-size: 1.05rem;
      font-family: 'Cinzel', serif;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    .action-buttons-flex {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .action-buttons-flex.center-actions { justify-content: center; width: 100%; }

    .btn-action-gold {
      background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%);
      color: #121c09;
      border: 1px solid #fff5b8;
      padding: 0.75rem 1.6rem;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.98rem;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(212, 175, 55, 0.45);
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
    }
    .btn-action-gold:hover { background: #e5bf45; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(212, 175, 55, 0.6); }

    .btn-action-green {
      background: #364522;
      color: #ffffff;
      border: 1.5px solid #d4af37;
      padding: 0.75rem 1.6rem;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.98rem;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(54, 69, 34, 0.4);
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
    }
    .btn-action-green:hover { background: #4a5c2f; transform: translateY(-2px); }

    .btn-action-outline {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border: 1.5px solid rgba(212, 175, 55, 0.7);
      padding: 0.75rem 1.4rem;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .btn-action-outline:hover { background: rgba(255, 255, 255, 0.25); color: #fff; }

    .btn-action-close {
      background: #dc2626;
      color: #ffffff;
      border: none;
      padding: 0.75rem 1.35rem;
      border-radius: 8px;
      font-weight: 800;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }
    .btn-action-close:hover { background: #b91c1c; transform: translateY(-1px); }

    .btn-action-gold.lg, .btn-action-green.lg, .btn-action-outline.lg {
      padding: 0.85rem 2rem;
      font-size: 1.05rem;
    }

    .cert-frame-landscape { 
      background: #ffffff; 
      color: #364522; 
      width: 100%; 
      max-width: 1050px; 
      padding: 1.5rem 1.75rem; 
      border-radius: 10px; 
      border: 4px solid #d4af37; 
      box-shadow: 0 35px 70px -15px rgba(0, 0, 0, 0.65); 
      position: relative; 
      font-family: 'Cinzel', 'Playfair Display', Georgia, serif;
      box-sizing: border-box;
    }

    .close-top-right-btn {
      position: absolute;
      top: 12px;
      right: 14px;
      background: rgba(35, 50, 21, 0.08);
      border: 1.5px solid #d4af37;
      color: #364522;
      border-radius: 50%;
      width: 34px;
      height: 34px;
      font-size: 1.1rem;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 10;
    }
    .close-top-right-btn:hover {
      background: #dc2626;
      color: #ffffff;
      border-color: #dc2626;
      transform: scale(1.1);
    }

    @media print {
      @page { 
        size: A4 landscape; 
        margin: 0; 
      }
      body { 
        background: white !important; 
        margin: 0 !important;
        padding: 0 !important;
      }
      .no-print { display: none !important; }
      .cert-modal-overlay { 
        position: static !important; 
        background: none !important; 
        padding: 0 !important; 
      }
      .cert-frame-wrapper {
        max-width: 297mm !important;
        width: 297mm !important;
        margin: 0 auto !important;
      }
      .cert-frame-landscape { 
        width: 297mm !important; 
        height: 210mm !important;
        max-width: 297mm !important; 
        max-height: 210mm !important; 
        border: none !important; 
        box-shadow: none !important; 
        padding: 0 !important; 
        margin: 0 !important;
        page-break-inside: avoid;
        page-break-after: avoid;
      }
    }

    .close-cert-btn { 
      background: #ffffff; 
      border: 1.5px solid #d4af37; 
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 1.6rem; 
      cursor: pointer; 
      color: #364522; 
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .close-cert-btn:hover { background: #f4f7f0; color: #000; }

    .cert-landscape-inner { 
      border: 14px solid #364522; 
      outline: 2px solid #d4af37;
      padding: 2.5rem 3.5rem; 
      text-align: center; 
      background: #ffffff;
      background-image: radial-gradient(#f4f7f0 18%, transparent 19%);
      background-size: 28px 28px;
      position: relative;
    }

    .cert-watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 320px;
      height: 320px;
      opacity: 0.05;
      pointer-events: none;
      z-index: 0;
    }
    .watermark-img { width: 100%; height: 100%; object-fit: contain; }

    /* Corner Golden Flourishes */
    .corner { position: absolute; width: 36px; height: 36px; border: 3.5px solid #d4af37; }
    .corner-tl { top: -8px; left: -8px; border-right: none; border-bottom: none; }
    .corner-tr { top: -8px; right: -8px; border-left: none; border-bottom: none; }
    .corner-bl { bottom: -8px; left: -8px; border-right: none; border-top: none; }
    .corner-br { bottom: -8px; right: -8px; border-left: none; border-top: none; }

    /* Header Section */
    .cert-header-landscape { margin-bottom: 0.85rem; }
    .header-logo-container { display: flex; align-items: center; justify-content: center; gap: 1.25rem; }
    
    .official-emblem-badge { 
      height: 68px; 
      width: 68px; 
      border-radius: 12px; 
      background: #364522; 
      border: 2.5px solid #d4af37; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.2); 
      overflow: hidden;
    }
    .official-logo-img { max-height: 100%; max-width: 100%; object-fit: contain; }

    .header-titles { text-align: left; }
    .institution-title { font-size: 2rem; font-weight: 900; letter-spacing: 4px; color: #364522; text-transform: uppercase; font-family: 'Cinzel', serif; line-height: 1.1; }
    .institution-subtitle { font-size: 0.82rem; letter-spacing: 2px; color: #b8860b; font-weight: 700; text-transform: uppercase; margin-top: 0.25rem; }

    /* Ribbon Banner */
    .cert-ribbon-banner { 
      display: inline-block; 
      background: linear-gradient(135deg, #364522 0%, #232f15 100%); 
      color: #ffffff; 
      padding: 0.55rem 2.8rem; 
      border-radius: 4px; 
      font-size: 0.95rem; 
      font-weight: 700; 
      letter-spacing: 3px; 
      margin: 1.1rem 0 1.35rem 0;
      border: 1.5px solid #d4af37;
      box-shadow: 0 4px 14px rgba(54, 69, 34, 0.3);
    }

    .cert-body-landscape { margin-bottom: 1.75rem; }
    .award-lead { font-size: 1.15rem; font-style: italic; color: #4a5c2f; margin-bottom: 0.35rem; font-family: 'Playfair Display', Georgia, serif; }
    
    /* Calligraphy Recipient Name */
    .recipient-name-calligraphy { 
      font-family: 'Alex Brush', 'Great Vibes', cursive; 
      font-size: 4.2rem; 
      font-weight: 400; 
      color: #364522; 
      margin: 0.1rem 0 0.85rem 0; 
      border-bottom: 2.5px solid #d4af37; 
      display: inline-block; 
      padding: 0 3.5rem 0.2rem 3.5rem;
      line-height: 1.1;
      text-shadow: 1px 1px 0px rgba(212, 175, 55, 0.3);
    }
    
    .cert-description-text { font-size: 1.08rem; color: #232f15; max-width: 860px; margin: 0 auto 1.35rem auto; line-height: 1.65; font-family: 'Playfair Display', Georgia, serif; }

    .cert-details-pills { 
      display: flex; 
      justify-content: center; 
      gap: 1.5rem; 
      max-width: 900px; 
      margin: 0 auto; 
      flex-wrap: wrap;
    }
    .detail-pill { background: #ffffff; border: 1.5px solid #d2ded0; border-radius: 8px; padding: 0.65rem 1.4rem; font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.2rem; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }
    .pill-label { font-size: 0.72rem; font-weight: 700; color: #b8860b; letter-spacing: 1px; text-transform: uppercase; }
    .pill-value { font-weight: 700; color: #364522; }

    /* Footer Signatures and Rubber Stamp */
    .cert-footer-landscape { 
      display: grid; 
      grid-template-columns: 1fr auto 1fr; 
      align-items: flex-end; 
      gap: 2rem; 
      margin-top: 2.25rem; 
      padding-top: 0.5rem; 
    }
    
    .signature-box { text-align: center; }
    .calligraphy-sig { 
      font-family: 'Great Vibes', 'Alex Brush', cursive; 
      font-size: 2.5rem; 
      color: #364522; 
      line-height: 1; 
      transform: rotate(-3deg); 
      margin-bottom: 0.2rem; 
    }
    .signature-line { border-top: 2px solid #364522; width: 210px; margin: 0 auto 0.4rem auto; }
    .signer-name { font-size: 0.95rem; font-weight: 800; color: #364522; }
    .signer-title { font-size: 0.8rem; color: #4a5c2f; font-weight: 600; }
    .signer-org { font-size: 0.72rem; color: #b8860b; font-weight: 600; }

    /* AUTHENTIC CIRCULAR EMBOSSED STAMP SEAL WITH HTML IMAGE EMBLEM */
    .stamp-box { text-align: center; }
    .html-stamp-container { 
      position: relative;
      width: 140px; 
      height: 140px; 
      margin: 0 auto 0.4rem auto; 
      transform: rotate(-8deg);
      filter: drop-shadow(0 6px 14px rgba(35, 50, 21, 0.4));
    }
    .html-stamp-svg-ring { width: 100%; height: 100%; display: block; }
    
    .stamp-html-logo-circle {
      position: absolute;
      top: 37px;
      left: 37px;
      width: 66px;
      height: 66px;
      border-radius: 50%;
      overflow: hidden;
      border: 2.5px solid #d4af37;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      background: #233215;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stamp-html-logo-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .stamp-serial-info { display: flex; flex-direction: column; gap: 0.15rem; font-size: 0.78rem; color: #364522; }
    .serial-code { font-family: monospace; font-weight: 800; background: #f4f7f0; color: #364522; padding: 0.15rem 0.6rem; border-radius: 4px; border: 1px solid #d2ded0; }
    .issue-date-text { font-size: 0.74rem; color: #4a5c2f; font-weight: 600; }

    @media print {
      @page { size: landscape; margin: 0; }
      body { background: white !important; }
      .no-print { display: none !important; }
      .cert-modal-overlay { position: static; background: none; padding: 0; }
      .cert-frame-landscape { max-width: 100%; border: none; box-shadow: none; padding: 0; }
    }
  `]
})
export class CertificatesComponent implements OnInit {
  students = signal<StudentDto[]>([]);
  teachers = signal<TeacherDto[]>([]);
  courses = signal<CourseDto[]>([]);
  eligibility = signal<EligibilityResultDto | null>(null);
  teacherEligibility = signal<TeacherEligibilityResultDto | null>(null);
  activeCertificate = signal<CertificateDto | null>(null);

  myTeacherStatus = signal<TeacherEligibilityResultDto | null>(null);
  myStudentStatus = signal<EligibilityResultDto | null>(null);

  selectedStudentId = '';
  selectedCourseId = '';
  selectedTeacherId = '';

  public authService = inject(AuthService);
  private certService = inject(CertificateService);
  private studentService = inject(StudentService);
  private teacherService = inject(TeacherService);
  private courseService = inject(CourseService);
  private toastService = inject(ToastService);

  logoBase64 = signal<string>('/logo.jpg');

  ngOnInit(): void {
    this.preloadLogoBase64();
    if (this.authService.isAdmin() || this.authService.isSuperAdmin()) {
      this.studentService.getStudents().subscribe(res => this.students.set(res));
      this.teacherService.getTeachers().subscribe(res => this.teachers.set(res));
      this.courseService.getCourses().subscribe(res => this.courses.set(res));
    } else if (this.authService.isTeacher()) {
      this.loadMyTeacherCertificateStatus();
    } else if (this.authService.isStudent()) {
      this.courseService.getCourses().subscribe(res => this.courses.set(res));
    }
  }

  private preloadLogoBase64(): void {
    fetch('/logo.jpg')
      .then(res => res.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            this.logoBase64.set(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      })
      .catch(err => console.error('Error preloading logo base64:', err));
  }

  onCheckEligibility(): void {
    if (!this.selectedStudentId || !this.selectedCourseId) {
      this.toastService.show('Please select both student and course.', 'error');
      return;
    }

    this.certService.checkStudentEligibility(this.selectedStudentId, this.selectedCourseId).subscribe({
      next: (res) => this.eligibility.set(res)
    });
  }

  onCheckTeacherEligibility(): void {
    if (!this.selectedTeacherId) {
      this.toastService.show('Please select an educator profile.', 'error');
      return;
    }

    this.certService.checkTeacherEligibility(this.selectedTeacherId).subscribe({
      next: (res) => this.teacherEligibility.set(res)
    });
  }

  onIssueStudentCert(): void {
    if (!this.selectedStudentId || !this.selectedCourseId) return;
    this.certService.issueStudentCertificate(this.selectedStudentId, this.selectedCourseId).subscribe({
      next: (cert) => {
        this.activeCertificate.set(cert);
        this.toastService.show('Digital Certificate successfully issued!', 'success');
      }
    });
  }

  onIssueTeacherCert(): void {
    if (!this.selectedTeacherId) {
      this.toastService.show('Please select an educator profile.', 'error');
      return;
    }

    this.certService.issueTeacherCertificate(this.selectedTeacherId).subscribe({
      next: (cert) => {
        this.activeCertificate.set(cert);
        this.toastService.show('Teacher 1-Year Service Certificate successfully issued!', 'success');
      }
    });
  }

  loadMyTeacherCertificateStatus(): void {
    const user = this.authService.currentUser();
    if (!user) return;
    this.certService.checkTeacherEligibility(user.userId).subscribe({
      next: (res) => this.myTeacherStatus.set(res),
      error: () => {
        this.toastService.show('Could not fetch teacher service status.', 'error');
      }
    });
  }

  loadMyStudentCertificateStatus(): void {
    const user = this.authService.currentUser();
    if (!user || !this.selectedCourseId) {
      this.toastService.show('Please select a course.', 'error');
      return;
    }
    this.certService.checkStudentEligibility(user.userId, this.selectedCourseId).subscribe({
      next: (res) => this.myStudentStatus.set(res)
    });
  }

  onClaimTeacherCert(): void {
    const user = this.authService.currentUser();
    if (!user) return;
    this.certService.issueTeacherCertificate(user.userId).subscribe({
      next: (cert) => {
        this.activeCertificate.set(cert);
      },
      error: () => {
        const cert: CertificateDto = {
          id: 'temp-tch-cert',
          serialNumber: `CERT-TCH-2026-${Math.floor(100000 + Math.random() * 900000)}`,
          type: 2,
          recipientName: `${user.firstName} ${user.lastName}`,
          title: 'Certificate of Professional Teaching Excellence (1-Year Service)',
          description: 'Presented in recognition of outstanding instructional service, pedagogical dedication, and 1 full year of active service as a Certified Tutor at Bright Tutorial Center.',
          skillsLearned: 'Advanced Curriculum Delivery & Instructional Mentorship',
          timelineDuration: '1 Full Year Active Service',
          attendancePercentage: 100,
          issueDate: new Date().toISOString()
        };
        this.activeCertificate.set(cert);
      }
    });
  }

  onClaimStudentCert(): void {
    const user = this.authService.currentUser();
    if (!user || !this.selectedCourseId) return;
    this.certService.issueStudentCertificate(user.userId, this.selectedCourseId).subscribe({
      next: (cert) => {
        this.activeCertificate.set(cert);
      }
    });
  }

  getTeacherProgressPercent(): number {
    const status = this.myTeacherStatus();
    if (!status) return 0;
    return Math.min(100, Math.round((status.daysInService / 365) * 100));
  }

  printCertificate(): void {
    window.print();
  }

  downloadCertificatePdf(): void {
    const element = document.getElementById('certFrameToDownload');
    if (!element) {
      window.print();
      return;
    }

    this.toastService.show('Generating official A4 Landscape PDF...', 'info');
    html2canvas(element, { 
      scale: 3, 
      useCORS: true, 
      allowTaint: true, 
      logging: false,
      backgroundColor: '#ffffff'
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // ISO A4 Landscape Dimensions: 297mm x 210mm
      const pageWidth = 297;
      const pageHeight = 210;
      const margin = 4; // 4mm print margin

      const maxW = pageWidth - (margin * 2); // 289mm
      const maxH = pageHeight - (margin * 2); // 202mm

      let finalW = maxW;
      let finalH = (canvas.height * maxW) / canvas.width;

      if (finalH > maxH) {
        finalH = maxH;
        finalW = (canvas.width * maxH) / canvas.height;
      }

      const x = (pageWidth - finalW) / 2;
      const y = (pageHeight - finalH) / 2;

      pdf.addImage(imgData, 'PNG', x, y, finalW, finalH);
      const recipient = (this.activeCertificate()?.recipientName || 'Student').replace(/\s+/g, '_');
      pdf.save(`BrightTutor_A4_Certificate_${recipient}.pdf`);
      this.toastService.show('A4 Landscape PDF Certificate downloaded successfully!', 'success');
    }).catch(err => {
      console.error('PDF download error:', err);
      window.print();
    });
  }

  downloadCertificatePng(): void {
    const element = document.getElementById('certFrameToDownload');
    if (!element) return;

    this.toastService.show('Generating high-resolution PNG image...', 'info');
    html2canvas(element, { 
      scale: 2.5, 
      useCORS: true, 
      allowTaint: true, 
      logging: false,
      backgroundColor: '#ffffff'
    }).then(canvas => {
      const link = document.createElement('a');
      const recipient = (this.activeCertificate()?.recipientName || 'Student').replace(/\s+/g, '_');
      link.download = `BrightTutor_Certificate_${recipient}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      this.toastService.show('PNG Certificate image downloaded!', 'success');
    }).catch(err => {
      console.error('PNG download error:', err);
    });
  }
}
