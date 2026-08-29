import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherApplicationService, TeacherApplicationDto } from '../../services/teacher-application.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-teacher-screening',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="screening-page">
      <div class="page-header">
        <h1>👨‍🏫 Teacher Applicants & CV Screening</h1>
        <p>Admin board to review applicant CV documents, approve credentials, or reject with custom feedback reasons.</p>
      </div>

      <div class="applications-list">
        @for (item of applications(); track item.id) {
          <div class="app-card">
            <div class="card-header">
              <div>
                <h3>{{ item.firstName }} {{ item.lastName }}</h3>
                <span class="sub-text">Specialization: {{ item.specialization }} | Experience: {{ item.yearsOfExperience }} Years</span>
              </div>
              <span class="status-pill" [ngClass]="getStatusClass(item.status)">
                {{ getStatusLabel(item.status) }}
              </span>
            </div>

            <div class="meta-grid">
              <div><strong>Email:</strong> {{ item.email }}</div>
              <div><strong>Phone:</strong> {{ item.phoneNumber }}</div>
              <div><strong>SLA Agreement:</strong> {{ item.hasAcceptedContractSla ? 'Accepted ✅' : 'Pending Acceptance ⏳' }}</div>
              <div><strong>Submitted Date:</strong> {{ item.createdAt | date:'mediumDate' }}</div>
            </div>

            <div class="bio-box">
              <strong>Professional Bio & Methodology:</strong>
              <p>{{ item.bioSummary || 'No bio provided.' }}</p>
            </div>

            <div class="docs-row">
              @if (item.cvDocumentUrl) {
                <a [href]="item.cvDocumentUrl" target="_blank" class="doc-link">📄 View CV / Resume Document</a>
              }
              @if (item.backgroundDocUrl) {
                <a [href]="item.backgroundDocUrl" target="_blank" class="doc-link">🎓 View Background Degree Certificate</a>
              }
            </div>

            @if (item.rejectionReason) {
              <div class="rejection-box">
                <strong>Rejection Reason:</strong> {{ item.rejectionReason }}
              </div>
            }

            <div class="card-actions">
              @if (item.status === 1) {
                <button type="button" class="btn-approve" (click)="approveTeacher(item.id)">Approve Credentials & Generate Teacher Code</button>
                <button type="button" class="btn-reject" (click)="rejectTeacher(item.id)">Reject Application</button>
              }
              @if (item.status === 2) {
                <span class="approved-text">✅ Approved Educator (Active for Class Assignment)</span>
              }
            </div>
          </div>
        } @empty {
          <div class="empty-state">No teacher candidate applications found.</div>
        }
      </div>
    </div>
  `,
  styles: [`
    .screening-page { padding: 1.5rem; }
    .page-header h1 { color: var(--color-primary); margin-bottom: 0.25rem; font-size: 1.75rem; }
    .page-header p { color: var(--color-muted); margin-bottom: 1.5rem; }
    .applications-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .app-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 1.25rem; box-shadow: var(--shadow-card); }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .card-header h3 { margin: 0 0 0.2rem 0; color: var(--color-text); font-size: 1.15rem; }
    .sub-text { font-size: 0.8rem; color: var(--color-muted); }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; font-size: 0.85rem; color: var(--color-text); margin-bottom: 1rem; background: var(--color-bg); padding: 0.75rem; border-radius: 8px; }
    .bio-box { font-size: 0.85rem; color: var(--color-text); margin-bottom: 0.75rem; }
    .bio-box p { margin: 0.2rem 0 0 0; color: var(--color-muted); }
    .docs-row { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .doc-link { color: var(--color-accent-bright); font-size: 0.85rem; text-decoration: none; font-weight: 600; }
    .doc-link:hover { text-decoration: underline; }
    .card-actions { border-top: 1px solid var(--color-border); padding-top: 0.75rem; display: flex; gap: 0.75rem; align-items: center; }
    .btn-approve { background: var(--color-success); color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-reject { background: var(--color-error); color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .approved-text { color: var(--color-success); font-weight: 600; font-size: 0.9rem; }
    .rejection-box { background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.85rem; margin-bottom: 0.75rem; }
    .status-pill { font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; }
    .status-pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .status-approved { background: var(--color-success-bg); color: var(--color-success); }
    .status-rejected { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .empty-state { text-align: center; padding: 3rem; color: var(--color-muted); background: var(--color-surface); border-radius: 12px; border: 1px solid var(--color-border); }
  `]
})
export class TeacherScreeningComponent implements OnInit {
  applications = signal<TeacherApplicationDto[]>([]);

  private teacherService = inject(TeacherApplicationService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.teacherService.getApplications().subscribe(res => this.applications.set(res));
  }

  approveTeacher(id: string): void {
    this.teacherService.approveTeacher(id).subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.loadApplications();
      }
    });
  }

  rejectTeacher(id: string): void {
    const reason = prompt('Enter rejection reason for candidate:') || 'Qualifications incomplete';
    this.teacherService.rejectTeacher(id, reason).subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.loadApplications();
      }
    });
  }

  getStatusLabel(status: number): string {
    if (status === 1) return 'Pending Document Screening';
    if (status === 2) return 'Approved Educator';
    return 'Rejected Candidate';
  }

  getStatusClass(status: number): string {
    if (status === 1) return 'status-pending';
    if (status === 2) return 'status-approved';
    return 'status-rejected';
  }
}
