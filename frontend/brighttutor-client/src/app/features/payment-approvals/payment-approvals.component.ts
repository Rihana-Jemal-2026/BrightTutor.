import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentRegistrationService, StudentRegistrationDto } from '../../services/student-registration.service';
import { TeacherService, TeacherDto } from '../../services/teacher.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-payment-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="approvals-page">
      <div class="page-header">
        <h1>💳 Student Registrations & Tutor Match Approvals</h1>
        <p>Review student applications, verify teacher availability (3–5h SLA), assign tutors, and cross-check payment receipt screenshots.</p>
      </div>

      <!-- Filter Pills -->
      <div class="filter-pills">
        <button [class.active]="filterStatus() === 'all'" (click)="filterStatus.set('all')">
          All Registrations ({{ registrations().length }})
        </button>
        <button [class.active]="filterStatus() === 'pending'" (click)="filterStatus.set('pending')">
          ⏳ Pending Teacher Check ({{ countByStatus('pending') }})
        </button>
        <button [class.active]="filterStatus() === 'awaiting_payment'" (click)="filterStatus.set('awaiting_payment')">
          🔵 Teacher Assigned / Awaiting Payment ({{ countByStatus('awaiting_payment') }})
        </button>
        <button [class.active]="filterStatus() === 'submitted'" (click)="filterStatus.set('submitted')">
          🟣 Payment Submitted (Verify Receipt) ({{ countByStatus('submitted') }})
        </button>
        <button [class.active]="filterStatus() === 'enrolled'" (click)="filterStatus.set('enrolled')">
          🟢 Verified & Enrolled ({{ countByStatus('enrolled') }})
        </button>
      </div>

      <div class="registrations-list">
        @for (item of filteredRegistrations(); track item.id) {
          <div class="registration-card">
            <div class="card-header">
              <div>
                <h3>{{ item.firstName }} {{ item.lastName }}</h3>
                <span class="sub-text">Email: {{ item.email }} | Phone: {{ item.phoneNumber }}</span>
              </div>
              <span class="status-pill" [ngClass]="getStatusClass(item.status)">
                {{ getStatusLabel(item.status) }}
              </span>
            </div>

            <div class="meta-grid">
              <div><strong>Grade/Status:</strong> {{ item.gradeLevel }}</div>
              <div><strong>Location:</strong> {{ item.address }}</div>
              <div><strong>Delivery Method:</strong> {{ getServiceTypeName(item.desiredServiceType) }}</div>
              <div><strong>Submitted At:</strong> {{ item.createdAt | date:'medium' }}</div>
            </div>

            @if (item.assignedTeacherName) {
              <div class="assigned-teacher-banner">
                👨‍🏫 <strong>Assigned Tutor:</strong> {{ item.assignedTeacherName }}
              </div>
            }

            @if (item.transactionId || item.receiptImageBase64) {
              <div class="receipt-section">
                <h4>🧾 Payment Slip Details</h4>
                <p><strong>Channel:</strong> {{ item.paymentChannel }} | <strong>Txn ID:</strong> <code class="txn-code">{{ item.transactionId }}</code> | <strong>Amount:</strong> ETB {{ item.amountPaid }}</p>

                @if (item.receiptImageBase64) {
                  <div class="receipt-thumbnail" (click)="selectedItemForReceipt.set(item)">
                    <img [src]="item.receiptImageBase64" alt="Receipt Screenshot" />
                    <span>🔍 Click to Cross-Check & Enlarge Screenshot</span>
                  </div>
                }
              </div>
            }

            <div class="card-actions">
              @if (isStatusPending(item.status)) {
                <button type="button" class="btn-assign" (click)="openAssignModal(item)">
                  👨‍🏫 Check Teacher Availability & Assign Tutor
                </button>
                <button type="button" class="btn-reject" (click)="rejectReg(item.id)">Reject</button>
              }
              @if (isStatusAwaitingPayment(item.status)) {
                <div class="awaiting-payment-info">
                  🔵 <strong>Tutor Assigned. Awaiting Student Payment Receipt Upload...</strong>
                </div>
                <button type="button" class="btn-reject" (click)="rejectReg(item.id)">Reject</button>
              }
              @if (isStatusSubmitted(item.status)) {
                <button type="button" class="btn-verify" (click)="verifyPayment(item.id)">
                  ✅ Verify Payment Receipt & Enroll Student
                </button>
                <button type="button" class="btn-reject" (click)="rejectReg(item.id)">Reject</button>
              }
              @if (isStatusVerified(item.status)) {
                <span class="verified-badge">✅ Verified Account Issued: <strong>{{ item.issuedStudentCode }}</strong></span>
              }
            </div>
          </div>
        } @empty {
          <div class="empty-state">No student registrations found for selected status filter.</div>
        }
      </div>

      <!-- ASSIGN TEACHER MODAL -->
      @if (assignModalItem(); as targetItem) {
        <div class="modal-overlay" (click)="assignModalItem.set(null)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>👨‍🏫 Assign Tutor & Approve Application</h3>
              <button type="button" class="close-btn" (click)="assignModalItem.set(null)">&times;</button>
            </div>

            <div class="modal-body">
              <p>Student: <strong>{{ targetItem.firstName }} {{ targetItem.lastName }}</strong> (Grade: {{ targetItem.gradeLevel }})</p>
              <p>Delivery: {{ getServiceTypeName(targetItem.desiredServiceType) }} | Location: {{ targetItem.address }}</p>

              <div class="form-group margin-top">
                <label>Select Tutor to Assign *</label>
                <select [(ngModel)]="selectedTeacherId">
                  <option value="">-- Select Certified Teacher --</option>
                  @for (t of teachers(); track t.id) {
                    <option [value]="t.id">{{ t.firstName }} {{ t.lastName }} ({{ t.specialization || 'General Tutor' }})</option>
                  }
                </select>
              </div>

              <div class="form-group margin-top">
                <label>Admin Notes / Special Instructions</label>
                <input type="text" [(ngModel)]="assignAdminNotes" placeholder="e.g. Matched for online evening classes" />
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn-secondary" (click)="assignModalItem.set(null)">Cancel</button>
              <button type="button" class="btn-primary" (click)="submitTeacherAssignment(targetItem.id)" [disabled]="!selectedTeacherId">
                Confirm Tutor & Approve Registration
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ENLARGED RECEIPT SCREENSHOT MODAL -->
      @if (selectedItemForReceipt(); as rItem) {
        <div class="modal-overlay" (click)="selectedItemForReceipt.set(null)">
          <div class="modal-card receipt-modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>🧾 Cross-Check Payment Receipt Screenshot</h3>
              <button type="button" class="close-btn" (click)="selectedItemForReceipt.set(null)">&times;</button>
            </div>

            <div class="receipt-modal-body">
              <div class="receipt-info-panel">
                <p><strong>Student:</strong> {{ rItem.firstName }} {{ rItem.lastName }}</p>
                <p><strong>Assigned Tutor:</strong> {{ rItem.assignedTeacherName || 'Pending' }}</p>
                <p><strong>Payment Channel:</strong> {{ rItem.paymentChannel }}</p>
                <p><strong>Transaction Ref ID:</strong> <code class="txn-code">{{ rItem.transactionId }}</code></p>
                <p><strong>Amount Paid:</strong> ETB {{ rItem.amountPaid }}</p>
                
                @if (rItem.status !== 4) {
                  <button type="button" class="btn-verify margin-top-full" (click)="verifyPayment(rItem.id); selectedItemForReceipt.set(null)">
                    ✅ Verify Receipt & Issue Account
                  </button>
                }
              </div>

              <div class="receipt-image-panel">
                <img [src]="rItem.receiptImageBase64" alt="Receipt Screenshot Enlarged" />
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .approvals-page { padding: 1.5rem; }
    .page-header h1 { color: var(--color-primary); margin-bottom: 0.25rem; font-size: 1.75rem; }
    .page-header p { color: var(--color-muted); margin-bottom: 1.5rem; }
    
    .filter-pills { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
    .filter-pills button { padding: 0.5rem 1rem; border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); border-radius: 20px; font-weight: 600; font-size: 0.85rem; cursor: pointer; }
    .filter-pills button.active { background: var(--color-accent); color: #fff; border-color: var(--color-accent); }
    
    .registrations-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .registration-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 1.25rem; box-shadow: var(--shadow-card); }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
    .card-header h3 { margin: 0 0 0.2rem 0; color: var(--color-text); font-size: 1.15rem; }
    .sub-text { font-size: 0.8rem; color: var(--color-muted); }
    
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; font-size: 0.85rem; color: var(--color-text); margin-bottom: 0.75rem; background: var(--color-bg); padding: 0.75rem; border-radius: 8px; }
    .assigned-teacher-banner { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #047857; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.88rem; margin-bottom: 0.75rem; }
    
    .receipt-section { border-top: 1px solid var(--color-border); padding-top: 0.75rem; margin-top: 0.75rem; }
    .receipt-section h4 { margin: 0 0 0.4rem 0; font-size: 0.85rem; color: var(--color-text); }
    .txn-code { background: rgba(59, 130, 246, 0.15); color: #3b82f6; padding: 0.2rem 0.4rem; border-radius: 4px; font-weight: 700; }
    .receipt-thumbnail { display: inline-flex; flex-direction: column; gap: 0.25rem; cursor: pointer; }
    .receipt-thumbnail img { width: 120px; height: 120px; object-fit: cover; border-radius: 6px; border: 1px solid var(--color-border); }
    .receipt-thumbnail span { font-size: 0.75rem; color: var(--color-accent); font-weight: 600; }
    
    .card-actions { margin-top: 1rem; display: flex; gap: 0.75rem; align-items: center; border-top: 1px solid var(--color-border); padding-top: 0.75rem; }
    .btn-assign { background: var(--color-accent); color: #fff; border: none; padding: 0.55rem 1.1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-verify { background: #10b981; color: #fff; border: none; padding: 0.55rem 1.1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-reject { background: var(--color-error); color: #fff; border: none; padding: 0.55rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: var(--color-accent); color: #fff; border: none; padding: 0.55rem 1.1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-secondary { background: var(--color-bg); color: var(--color-text); border: 1px solid var(--color-border); padding: 0.55rem 1.1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .verified-badge { color: #10b981; font-weight: 600; font-size: 0.9rem; }
    .awaiting-payment-info { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: #2563eb; padding: 0.5rem 0.85rem; border-radius: 6px; font-size: 0.88rem; flex: 1; }
    
    .status-pill { font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; }
    .status-pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .status-approved { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .status-verified { background: rgba(16, 185, 129, 0.15); color: #10b981; }
    .status-rejected { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    
    .modal-overlay { fixed: true; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-card { background: var(--color-surface); width: 90%; max-width: 500px; border-radius: 12px; padding: 1.25rem; border: 1px solid var(--color-border); box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
    .receipt-modal-card { max-width: 800px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem; }
    .modal-header h3 { margin: 0; font-size: 1.1rem; color: var(--color-text); }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--color-muted); }
    .margin-top { margin-top: 1rem; }
    .margin-top-full { margin-top: 1rem; width: 100%; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
    .form-group select, .form-group input { padding: 0.6rem; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem; border-top: 1px solid var(--color-border); padding-top: 0.75rem; }
    
    .receipt-modal-body { display: grid; grid-template-columns: 280px 1fr; gap: 1.25rem; }
    .receipt-info-panel p { margin: 0 0 0.5rem 0; font-size: 0.88rem; color: var(--color-text); }
    .receipt-image-panel img { max-width: 100%; max-height: 450px; border-radius: 8px; border: 1px solid var(--color-border); }
    .empty-state { text-align: center; padding: 3rem; color: var(--color-muted); background: var(--color-surface); border-radius: 12px; border: 1px solid var(--color-border); }
  `]
})
export class PaymentApprovalsComponent implements OnInit {
  registrations = signal<StudentRegistrationDto[]>([]);
  teachers = signal<TeacherDto[]>([]);
  filterStatus = signal<'all' | 'pending' | 'awaiting_payment' | 'submitted' | 'enrolled'>('all');

  assignModalItem = signal<StudentRegistrationDto | null>(null);
  selectedTeacherId = '';
  assignAdminNotes = '';

  selectedItemForReceipt = signal<StudentRegistrationDto | null>(null);

  private regService = inject(StudentRegistrationService);
  private teacherService = inject(TeacherService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.loadRegistrations();
    this.teacherService.getTeachers().subscribe(res => this.teachers.set(res));
  }

  loadRegistrations(): void {
    this.regService.getPendingApprovals().subscribe(res => this.registrations.set(res));
  }

  isStatusPending(status: any): boolean {
    return status === 1 || status === 'PendingTeacherCheck' || status === 'PendingApproval' || status === '1';
  }

  isStatusAwaitingPayment(status: any): boolean {
    return status === 2 || status === 'ApprovedPendingPayment' || status === '2';
  }

  isStatusSubmitted(status: any): boolean {
    return status === 3 || status === 'PaymentSubmitted' || status === '3';
  }

  isStatusVerified(status: any): boolean {
    return status === 4 || status === 'VerifiedAndEnrolled' || status === '4';
  }

  isStatusRejected(status: any): boolean {
    return status === 5 || status === 'Rejected' || status === '5';
  }

  filteredRegistrations(): StudentRegistrationDto[] {
    const list = this.registrations();
    const st = this.filterStatus();
    if (st === 'pending') return list.filter(r => this.isStatusPending(r.status));
    if (st === 'awaiting_payment') return list.filter(r => this.isStatusAwaitingPayment(r.status));
    if (st === 'submitted') return list.filter(r => this.isStatusSubmitted(r.status));
    if (st === 'enrolled') return list.filter(r => this.isStatusVerified(r.status));
    return list;
  }

  countByStatus(statusKey: 'pending' | 'awaiting_payment' | 'submitted' | 'enrolled'): number {
    if (statusKey === 'pending') return this.registrations().filter(r => this.isStatusPending(r.status)).length;
    if (statusKey === 'awaiting_payment') return this.registrations().filter(r => this.isStatusAwaitingPayment(r.status)).length;
    if (statusKey === 'submitted') return this.registrations().filter(r => this.isStatusSubmitted(r.status)).length;
    if (statusKey === 'enrolled') return this.registrations().filter(r => this.isStatusVerified(r.status)).length;
    return 0;
  }

  openAssignModal(item: StudentRegistrationDto): void {
    this.assignModalItem.set(item);
    this.selectedTeacherId = '';
    this.assignAdminNotes = '';
  }

  submitTeacherAssignment(id: string): void {
    if (!this.selectedTeacherId) {
      this.toastService.show('Please select a teacher to assign.', 'error');
      return;
    }

    this.regService.assignTeacher(id, this.selectedTeacherId, this.assignAdminNotes).subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.assignModalItem.set(null);
        this.loadRegistrations();
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Failed to assign teacher.', 'error');
      }
    });
  }

  verifyPayment(id: string): void {
    this.regService.verifyPayment(id).subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.loadRegistrations();
      },
      error: (err) => {
        this.toastService.show(err.error?.message || 'Payment verification failed.', 'error');
      }
    });
  }

  rejectReg(id: string): void {
    const reason = prompt('Enter rejection reason:') || 'Information invalid';
    this.regService.rejectRegistration(id, reason).subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.loadRegistrations();
      }
    });
  }

  getServiceTypeName(type: any): string {
    if (type === 1 || type === 'Online' || type === '1') return '💻 Online 1-on-1';
    if (type === 2 || type === 'Group' || type === '2') return '👥 In-Person Group';
    return '🏠 Home-to-Home Visit';
  }

  getStatusLabel(status: any): string {
    if (this.isStatusPending(status)) return 'Pending Teacher Check (3-5h)';
    if (this.isStatusAwaitingPayment(status)) return 'Tutor Assigned: Awaiting Payment';
    if (this.isStatusSubmitted(status)) return 'Payment Receipt Submitted';
    if (this.isStatusVerified(status)) return 'Verified & Enrolled';
    return 'Rejected';
  }

  getStatusClass(status: any): string {
    if (this.isStatusPending(status)) return 'status-pending';
    if (this.isStatusAwaitingPayment(status)) return 'status-approved';
    if (this.isStatusSubmitted(status)) return 'status-approved';
    if (this.isStatusVerified(status)) return 'status-verified';
    return 'status-rejected';
  }
}
