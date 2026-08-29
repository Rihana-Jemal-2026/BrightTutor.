import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CertificateService, CertificateDto, EligibilityResultDto } from '../../services/certificate.service';
import { StudentService, StudentDto } from '../../services/student.service';
import { TeacherService, TeacherDto } from '../../services/teacher.service';
import { CourseService, CourseDto } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-certificates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="certificates-page">
      <div class="page-header">
        <h1>📜 Automated Digital Certificate Generator</h1>
        <p>Issue and verify official 3-Month Student Completion & 1-Year Teacher Service Certificates.</p>
      </div>

      <!-- Action Panel: Student Eligibility Evaluator -->
      <div class="evaluator-card">
        <h3>🎓 Student 3-Month Course Completion Evaluator</h3>
        <p class="rule-hint">Rule: Must complete 3-Month curriculum timeline with &lt;20.0% absences (&ge;80% attendance rate).</p>

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
              <div><strong>Attendance Rate:</strong> {{ eligibility()?.attendancePercentage }}%</div>
              <div><strong>Absence Rate:</strong> {{ eligibility()?.absencePercentage }}% (Max Allowed: 20%)</div>
            </div>

            @if (eligibility()?.isEligible) {
              <button type="button" class="btn-issue" (click)="onIssueStudentCert()">🎉 Generate & Issue Digital Certificate</button>
            }
          </div>
        }
      </div>

      <!-- Action Panel: Teacher Service Excellence Generator -->
      <div class="evaluator-card teacher-card">
        <h3>👨‍🏫 Teacher 1-Year Service Excellence Certificate</h3>
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
            <button type="button" class="btn-issue-tch" (click)="onIssueTeacherCert()">🏆 Issue 1-Year Service Certificate</button>
          </div>
        </div>
      </div>

      <!-- Rendered Digital Certificate Preview Modal -->
      @if (activeCertificate()) {
        <div class="cert-modal-overlay" (click)="activeCertificate.set(null)">
          <div class="cert-frame" (click)="$event.stopPropagation()">
            <button type="button" class="close-cert-btn" (click)="activeCertificate.set(null)">&times;</button>
            
            <div class="cert-inner-border">
              <div class="cert-seal">🏅</div>
              <div class="cert-header">BRIGHTTUTOR ACADEMIC ACADEMY</div>
              <div class="cert-sub">OFFICIAL DIPLOMA OF EXCELLENCE</div>

              <div class="cert-body">
                <p>This official certificate is proudly awarded to</p>
                <h1 class="recipient-name">{{ activeCertificate()?.recipientName }}</h1>
                <p class="cert-desc">{{ activeCertificate()?.description }}</p>

                <div class="cert-details">
                  <div><strong>Timeline Duration:</strong> {{ activeCertificate()?.timelineDuration }}</div>
                  <div><strong>Core Skills Mastery:</strong> {{ activeCertificate()?.skillsLearned }}</div>
                </div>
              </div>

              <div class="cert-footer">
                <div class="sig-block">
                  <div class="sig-line">Academic Board Director</div>
                </div>
                <div class="cert-serial">
                  <strong>Serial Number:</strong> <code>{{ activeCertificate()?.serialNumber }}</code><br/>
                  <span>Issued Date: {{ activeCertificate()?.issueDate | date:'mediumDate' }}</span>
                </div>
                <div class="sig-block">
                  <div class="sig-line">Director of Education</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .certificates-page { padding: 1.5rem; }
    .page-header h1 { color: var(--color-primary); margin-bottom: 0.25rem; font-size: 1.75rem; }
    .page-header p { color: var(--color-muted); margin-bottom: 1.5rem; }
    .evaluator-card { background: var(--color-surface); border: 1px solid var(--color-border); padding: 1.5rem; border-radius: 14px; box-shadow: var(--shadow-card); margin-bottom: 1.5rem; }
    .evaluator-card h3 { margin: 0 0 0.25rem 0; color: var(--color-text); }
    .rule-hint { font-size: 0.8rem; color: var(--color-muted); margin-bottom: 1rem; }
    .eval-form-row { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; flex: 1; min-width: 220px; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
    .form-group select { padding: 0.65rem; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); }
    .btn-check { background: var(--color-accent); color: #fff; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-issue { background: var(--color-success); color: #fff; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 0.75rem; }
    .btn-issue-tch { background: #8b5cf6; color: #fff; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; }

    .eligibility-result { margin-top: 1.25rem; padding: 1rem; border-radius: 10px; }
    .eligibility-result.eligible { background: var(--color-success-bg); border: 1px solid var(--color-success); color: var(--color-success); }
    .eligibility-result.ineligible { background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #ef4444; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.5rem; font-size: 0.85rem; margin-top: 0.5rem; }

    /* Digital Certificate Frame */
    .cert-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .cert-frame { background: #fff8eb; color: #1e293b; width: 100%; max-width: 800px; padding: 2rem; border-radius: 16px; border: 8px double #d97706; box-shadow: 0 20px 40px rgba(0,0,0,0.5); position: relative; }
    .close-cert-btn { position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.75rem; cursor: pointer; color: #78350f; }
    .cert-inner-border { border: 2px solid #b45309; padding: 2rem; text-align: center; border-radius: 8px; }
    .cert-seal { font-size: 3rem; margin-bottom: 0.25rem; }
    .cert-header { font-size: 1.5rem; font-weight: 900; letter-spacing: 2px; color: #78350f; }
    .cert-sub { font-size: 0.85rem; font-weight: 700; letter-spacing: 1px; color: #b45309; margin-bottom: 1.5rem; }
    .recipient-name { font-size: 2.25rem; font-family: serif; color: #92400e; margin: 0.5rem 0; text-decoration: underline; }
    .cert-desc { font-size: 0.95rem; color: #451a03; max-width: 600px; margin: 0 auto 1.25rem auto; line-height: 1.5; }
    .cert-details { background: #fef3c7; padding: 0.75rem; border-radius: 8px; font-size: 0.85rem; display: flex; justify-content: space-around; margin-bottom: 1.5rem; color: #78350f; }
    .cert-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 2rem; }
    .sig-block { width: 180px; text-align: center; }
    .sig-line { border-top: 1px solid #78350f; padding-top: 0.3rem; font-size: 0.8rem; font-weight: 700; color: #78350f; }
    .cert-serial { font-size: 0.75rem; color: #78350f; }
    .cert-serial code { font-weight: 800; background: #fde68a; padding: 0.1rem 0.4rem; border-radius: 4px; }
  `]
})
export class CertificatesComponent implements OnInit {
  students = signal<StudentDto[]>([]);
  teachers = signal<TeacherDto[]>([]);
  courses = signal<CourseDto[]>([]);
  eligibility = signal<EligibilityResultDto | null>(null);
  activeCertificate = signal<CertificateDto | null>(null);

  selectedStudentId = '';
  selectedCourseId = '';
  selectedTeacherId = '';

  private certService = inject(CertificateService);
  private studentService = inject(StudentService);
  private teacherService = inject(TeacherService);
  private courseService = inject(CourseService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.studentService.getStudents().subscribe(res => this.students.set(res));
    this.teacherService.getTeachers().subscribe(res => this.teachers.set(res));
    this.courseService.getCourses().subscribe(res => this.courses.set(res));
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
      this.toastService.show('Please select educator profile.', 'error');
      return;
    }

    this.certService.issueTeacherCertificate(this.selectedTeacherId).subscribe({
      next: (cert) => {
        this.activeCertificate.set(cert);
        this.toastService.show('Teacher Service Certificate successfully issued!', 'success');
      }
    });
  }
}
