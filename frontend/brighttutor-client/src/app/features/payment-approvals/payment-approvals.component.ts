import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentRegistrationService, StudentRegistrationDto } from '../../services/student-registration.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-payment-approvals',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="approvals-page">
      <div class="page-header">
        <h1>💳 Student Registrations & Payment Approvals</h1>
        <p>Admin verification queue for student self-registrations and CBE Birr / Telebirr receipt screenshots.</p>
      </div>

      <div class="registrations-list">
        @for (item of registrations(); track item.id) {
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

            @if (item.transactionId || item.receiptImageBase64) {
              <div class="receipt-section">
                <h4>🧾 Payment Slip Details</h4>
                <p><strong>Channel:</strong> {{ item.paymentChannel }} | <strong>Txn ID:</strong> <code class="txn-code">{{ item.transactionId }}</code> | <strong>Amount:</strong> ETB {{ item.amountPaid }}</p>

                @if (item.receiptImageBase64) {
                  <div class="receipt-thumbnail" (click)="selectedReceipt.set(item.receiptImageBase64)">
                    <img [src]="item.receiptImageBase64" alt="Receipt Screenshot" />
                    <span>🔍 Click to Enlarge Receipt</span>
                  </div>
                }
              </div>
            }

            <div class="card-actions">
              @if (item.status === 1) {
                <button type="button" class="btn-approve" (click)="approveReg(item.id)">Approve Student Info</button>
                <button type="button" class="btn-reject" (click)="rejectReg(item.id)">Reject</button>
              }
              @if (item.status === 2 || item.status === 3) {
                <button type="button" class="btn-verify" (click)="verifyPayment(item.id)">Verify Payment & Generate Student ID</button>
                <button type="button" class="btn-reject" (click)="rejectReg(item.id)">Reject Payment</button>
              }
              @if (item.status === 4) {
                <span class="verified-badge">✅ Verified Student ID Issued: <strong>{{ item.issuedStudentCode }}</strong></span>
              }
            </div>
          </div>
        } @empty {
          <div class="empty-state">No pending student registration or payment approvals found.</div>
        }
      </div>

      <!-- Receipt Image Preview Modal -->
      @if (selectedReceipt()) {
        <div class="modal-overlay" (click)="selectedReceipt.set(null)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>🧾 Enlarged Payment Receipt Screenshot</h3>
              <button type="button" class="close-btn" (click)="selectedReceipt.set(null)">&times;</button>
            </div>
            <img [src]="selectedReceipt()" alt="Receipt Screenshot Enlarged" style="max-width: 100%; border-radius: 8px;" />
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .approvals-page { padding: 1.5rem; }
    .page-header h1 { color: var(--color-primary); margin-bottom: 0.25rem; font-size: 1.75rem; }
    .page-header p { color: var(--color-muted); margin-bottom: 1.5rem; }
    .registrations-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .registration-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 12px; padding: 1.25rem; box-shadow: var(--shadow-card); }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .card-header h3 { margin: 0 0 0.2rem 0; color: var(--color-text); font-size: 1.15rem; }
    .sub-text { font-size: 0.8rem; color: var(--color-muted); }
    .meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem; font-size: 0.85rem; color: var(--color-text); margin-bottom: 1rem; background: var(--color-bg); padding: 0.75rem; border-radius: 8px; }
    .receipt-section { border-top: 1px solid var(--color-border); padding-top: 0.75rem; margin-top: 0.75rem; }
    .receipt-section h4 { margin: 0 0 0.4rem 0; font-size: 0.85rem; color: var(--color-text); }
    .txn-code { background: rgba(59, 130, 246, 0.15); color: #3b82f6; padding: 0.2rem 0.4rem; border-radius: 4px; font-weight: 700; }
    .receipt-thumbnail { display: inline-flex; flex-direction: column; gap: 0.25rem; cursor: pointer; }
    .receipt-thumbnail img { width: 100px; height: 100px; object-fit: cover; border-radius: 6px; border: 1px solid var(--color-border); }
    .receipt-thumbnail span { font-size: 0.75rem; color: var(--color-muted); }
    .card-actions { margin-top: 1rem; display: flex; gap: 0.75rem; align-items: center; border-top: 1px solid var(--color-border); padding-top: 0.75rem; }
    .btn-approve { background: var(--color-accent); color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-verify { background: var(--color-success); color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-reject { background: var(--color-error); color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .verified-badge { color: var(--color-success); font-weight: 600; font-size: 0.9rem; }
    .status-pill { font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; }
    .status-pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .status-approved { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .status-verified { background: var(--color-success-bg); color: var(--color-success); }
    .status-rejected { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .empty-state { text-align: center; padding: 3rem; color: var(--color-muted); background: var(--color-surface); border-radius: 12px; border: 1px solid var(--color-border); }
  `]
})
export class PaymentApprovalsComponent implements OnInit {
  registrations = signal<StudentRegistrationDto[]>([]);
  selectedReceipt = signal<string | null>(null);

  private regService = inject(StudentRegistrationService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.loadRegistrations();
  }

  loadRegistrations(): void {
    this.regService.getPendingApprovals().subscribe(res => this.registrations.set(res));
  }

  approveReg(id: string): void {
    this.regService.approveRegistration(id).subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.loadRegistrations();
      }
    });
  }

  verifyPayment(id: string): void {
    this.regService.verifyPayment(id).subscribe({
      next: (res) => {
        this.toastService.show(res.message, 'success');
        this.loadRegistrations();
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

  getServiceTypeName(type: number): string {
    if (type === 1) return '💻 Online 1-on-1';
    if (type === 2) return '👥 In-Person Group';
    return '🏠 Home-to-Home Visit';
  }

  getStatusLabel(status: number): string {
    if (status === 1) return 'Pending Info Review';
    if (status === 2) return 'Approved: Awaiting Payment';
    if (status === 3) return 'Payment Slip Uploaded';
    if (status === 4) return 'Verified & Enrolled';
    return 'Rejected';
  }

  getStatusClass(status: number): string {
    if (status === 1) return 'status-pending';
    if (status === 2) return 'status-approved';
    if (status === 3) return 'status-approved';
    if (status === 4) return 'status-verified';
    return 'status-rejected';
  }
}
