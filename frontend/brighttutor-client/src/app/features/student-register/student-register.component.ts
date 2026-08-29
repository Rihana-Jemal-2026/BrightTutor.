import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentRegistrationService } from '../../services/student-registration.service';
import { CourseService, CourseDto } from '../../services/course.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-student-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="register-page">
      <div class="page-header">
        <h1>🎓 BrightTutor Student Admission & Registration</h1>
        <p>Enroll in our 3-Month IT & Academic Courses. Select delivery method, choose course, and submit tuition payment slip.</p>
      </div>

      <div class="registration-card">
        <!-- Form Step 1: Personal & Course Selection -->
        @if (currentStep() === 1) {
          <form (ngSubmit)="onSubmitRegistration()">
            <h3>1. Personal Details & Desired Course</h3>

            <div class="form-row">
              <div class="form-group">
                <label>First Name *</label>
                <input type="text" [(ngModel)]="form.firstName" name="firstName" placeholder="e.g. Samuel" required />
              </div>
              <div class="form-group">
                <label>Last Name *</label>
                <input type="text" [(ngModel)]="form.lastName" name="lastName" placeholder="e.g. Bekele" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Email Address *</label>
                <input type="email" [(ngModel)]="form.email" name="email" placeholder="samuel@gmail.com" required />
              </div>
              <div class="form-group">
                <label>Phone Number *</label>
                <input type="tel" [(ngModel)]="form.phoneNumber" name="phoneNumber" placeholder="+251 911 000 000" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Grade Level / Professional Status *</label>
                <input type="text" [(ngModel)]="form.gradeLevel" name="gradeLevel" placeholder="Grade 11 / University / Professional" required />
              </div>
              <div class="form-group">
                <label>Home Address / GPS Location *</label>
                <input type="text" [(ngModel)]="form.address" name="address" placeholder="Bole Subcity, Woreda 03, Addis Ababa" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Service Delivery Method *</label>
                <select [(ngModel)]="form.desiredServiceType" name="desiredServiceType" required>
                  <option [ngValue]="1">💻 Online 1-on-1 Tutoring</option>
                  <option [ngValue]="2">👥 In-Person Group Class (Center)</option>
                  <option [ngValue]="3">🏠 Home-to-Home Visit (Personal Tutor)</option>
                </select>
              </div>

              <div class="form-group">
                <label>Select 3-Month Course Curriculum *</label>
                <select [(ngModel)]="form.courseId" name="courseId" required>
                  <option value="">-- Choose Course Catalog (15 Available) --</option>
                  @for (course of courses(); track course.id) {
                    <option [value]="course.id">{{ course.name }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="submitting()">
                @if (submitting()) { Submitting... } @else { Submit Registration & Proceed to Payment Slip }
              </button>
            </div>
          </form>
        }

        <!-- Form Step 2: Payment Receipt Slip Upload (Telebirr / CBE Birr) -->
        @if (currentStep() === 2) {
          <div class="payment-step">
            <div class="status-banner info">
              ℹ️ Your registration form is submitted! Status: <strong>Pending Tuition Payment Verification</strong>
            </div>

            <h3>2. CBE Birr / Telebirr Tuition Receipt Submission</h3>
            <p>Please transfer your tuition fee to one of our official accounts and upload the screenshot below:</p>

            <div class="bank-accounts-card">
              <div class="account-item">
                <span class="account-icon">🏦</span>
                <div>
                  <strong>Commercial Bank of Ethiopia (CBE)</strong>
                  <p>Account: 1000123456789 | Name: BrightTutor Academy</p>
                </div>
              </div>
              <div class="account-item">
                <span class="account-icon">📱</span>
                <div>
                  <strong>Telebirr Transfer / Merchant</strong>
                  <p>Mobile: 0911000000 | Merchant Shortcode: 889900</p>
                </div>
              </div>
            </div>

            <form (ngSubmit)="onSubmitReceipt()">
              <div class="form-row">
                <div class="form-group">
                  <label>Payment Channel *</label>
                  <select [(ngModel)]="receiptForm.paymentChannel" name="paymentChannel">
                    <option value="CBE Birr">CBE Birr / CBE Bank</option>
                    <option value="Telebirr">Telebirr Transfer</option>
                    <option value="Bank Transfer">Other Bank Transfer</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Transaction Reference ID *</label>
                  <input type="text" [(ngModel)]="receiptForm.transactionId" name="transactionId" placeholder="e.g. FT26082699X" required />
                </div>
                <div class="form-group">
                  <label>Amount Paid (ETB) *</label>
                  <input type="number" [(ngModel)]="receiptForm.amountPaid" name="amountPaid" placeholder="3500.00" required />
                </div>
              </div>

              <div class="form-group">
                <label>Upload Receipt Screenshot *</label>
                <input type="file" (change)="onFileSelected($event)" accept="image/*" required />
              </div>

              @if (receiptForm.receiptImageBase64) {
                <div class="receipt-preview">
                  <p>Receipt Preview:</p>
                  <img [src]="receiptForm.receiptImageBase64" alt="Receipt Screenshot" />
                </div>
              }

              <div class="form-actions">
                <button type="submit" class="btn-success" [disabled]="submittingReceipt()">
                  @if (submittingReceipt()) { Uploading... } @else { Upload Receipt & Request Verification }
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Form Step 3: Complete & Pending Admin SLA -->
        @if (currentStep() === 3) {
          <div class="complete-step">
            <div class="success-box">
              <h2>🎉 Registration & Payment Slip Submitted!</h2>
              <p>Your payment verification request has been queued. Our admin team will verify the transaction ID within <strong>1 - 3 business hours</strong>.</p>
              <p>Once verified, your <strong>Student ID Credentials</strong> will be dispatched to your email ({{ form.email }}) and displayed on your student portal.</p>
              <button type="button" class="btn-primary" (click)="resetForm()">Register Another Student</button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .register-page { padding: 1.5rem; max-width: 900px; margin: 0 auto; }
    .page-header h1 { color: var(--color-primary); margin-bottom: 0.25rem; font-size: 1.75rem; }
    .page-header p { color: var(--color-muted); margin-bottom: 1.5rem; }
    .registration-card { background: var(--color-surface); border: 1px solid var(--color-border); padding: 1.5rem; border-radius: 14px; box-shadow: var(--shadow-card); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
    .form-group input, .form-group select { padding: 0.65rem; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); }
    .form-actions { margin-top: 1.5rem; text-align: right; }
    .btn-primary { background: var(--color-accent); color: #fff; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-success { background: var(--color-success); color: #fff; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .status-banner { padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); color: #3b82f6; }
    .bank-accounts-card { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; background: var(--color-bg); padding: 1rem; border-radius: 10px; }
    .account-item { display: flex; align-items: center; gap: 0.75rem; }
    .account-icon { font-size: 1.5rem; }
    .account-item strong { display: block; font-size: 0.9rem; color: var(--color-text); }
    .account-item p { margin: 0; font-size: 0.8rem; color: var(--color-muted); }
    .receipt-preview img { max-width: 200px; max-height: 200px; border-radius: 8px; border: 1px solid var(--color-border); margin-top: 0.5rem; }
    .success-box { text-align: center; padding: 2rem; }
    .success-box h2 { color: var(--color-success); margin-bottom: 0.5rem; }
  `]
})
export class StudentRegisterComponent implements OnInit {
  courses = signal<CourseDto[]>([]);
  currentStep = signal<number>(1);
  submitting = signal<boolean>(false);
  submittingReceipt = signal<boolean>(false);
  createdRegistrationId = signal<string>('');

  form = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gradeLevel: '',
    address: '',
    desiredServiceType: 1,
    courseId: ''
  };

  receiptForm = {
    paymentChannel: 'CBE Birr',
    transactionId: '',
    amountPaid: 3500,
    receiptImageBase64: ''
  };

  private registrationService = inject(StudentRegistrationService);
  private courseService = inject(CourseService);
  private toastService = inject(ToastService);

  ngOnInit(): void {
    this.courseService.getCourses().subscribe(res => this.courses.set(res));
  }

  onSubmitRegistration(): void {
    if (!this.form.firstName || !this.form.email || !this.form.courseId) {
      this.toastService.show('Please fill in all required fields.', 'error');
      return;
    }

    this.submitting.set(true);
    this.registrationService.submitRegistration(this.form).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.createdRegistrationId.set(res.registrationId);
        this.currentStep.set(2);
        this.toastService.show(res.message, 'success');
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.show(err.error?.message || 'Registration failed.', 'error');
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.receiptForm.receiptImageBase64 = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmitReceipt(): void {
    if (!this.receiptForm.transactionId) {
      this.toastService.show('Please enter transaction reference ID.', 'error');
      return;
    }

    this.submittingReceipt.set(true);
    this.registrationService.uploadReceipt({
      registrationId: this.createdRegistrationId(),
      ...this.receiptForm
    }).subscribe({
      next: (res) => {
        this.submittingReceipt.set(false);
        this.currentStep.set(3);
        this.toastService.show(res.message, 'success');
      },
      error: (err) => {
        this.submittingReceipt.set(false);
        this.toastService.show(err.error?.message || 'Receipt upload failed.', 'error');
      }
    });
  }

  resetForm(): void {
    this.currentStep.set(1);
    this.form = { firstName: '', lastName: '', email: '', phoneNumber: '', gradeLevel: '', address: '', desiredServiceType: 1, courseId: '' };
    this.receiptForm = { paymentChannel: 'CBE Birr', transactionId: '', amountPaid: 3500, receiptImageBase64: '' };
  }
}
