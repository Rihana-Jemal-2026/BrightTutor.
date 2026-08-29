import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeacherApplicationService } from '../../services/teacher-application.service';
import { ToastService } from '../../services/toast.service';
import { COUNTRY_PHONE_LIST } from '../../models/country-phone.data';

@Component({
  selector: 'app-teacher-apply',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="teacher-apply-page">
      <div class="page-header">
        <h1>👨‍🏫 Join BrightTutor as a Certified Educator</h1>
        <p>Submit your academic background, specialization, CV, and work credentials for screening.</p>
      </div>

      <div class="apply-card">
        @if (!submitted()) {
          <form (ngSubmit)="onSubmitApplication()">
            <h3>Teacher Application & Document Screening Form</h3>

            <div class="form-row">
              <div class="form-group">
                <label>First Name *</label>
                <input type="text" [(ngModel)]="form.firstName" name="firstName" placeholder="e.g. Abebe" required />
              </div>
              <div class="form-group">
                <label>Last Name *</label>
                <input type="text" [(ngModel)]="form.lastName" name="lastName" placeholder="e.g. Kebede" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Email Address *</label>
                <input type="email" [(ngModel)]="form.email" name="email" placeholder="abebe@gmail.com" required />
              </div>
              <div class="form-group">
                <label>Insert Your Phone Number *</label>
                <div class="phone-input-container">
                  <select [(ngModel)]="selectedCountryCode" name="selectedCountryCode" class="country-code-select">
                    @for (c of countryList; track c.code) {
                      <option [value]="c.dialCode">{{ c.flag }} {{ c.dialCode }} ({{ c.name }})</option>
                    }
                  </select>
                  <input type="tel" [(ngModel)]="phoneNumberInput" name="phoneNumberInput" placeholder="Insert your phone number (e.g. 911 222 333)" required />
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Primary Teaching Specialization *</label>
                <input type="text" [(ngModel)]="form.specialization" name="specialization" placeholder="e.g. Full-Stack Web Dev / Physics / SAT Math" required />
              </div>
              <div class="form-group">
                <label>Years of Teaching Experience *</label>
                <input type="number" [(ngModel)]="form.yearsOfExperience" name="yearsOfExperience" placeholder="3" required />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>CV / Resume Document URL *</label>
                <input type="url" [(ngModel)]="form.cvDocumentUrl" name="cvDocumentUrl" placeholder="https://drive.google.com/your-cv.pdf" required />
              </div>
              <div class="form-group">
                <label>Background Certificate / Degree Document URL</label>
                <input type="url" [(ngModel)]="form.backgroundDocUrl" name="backgroundDocUrl" placeholder="https://drive.google.com/your-degree.pdf" />
              </div>
            </div>

            <div class="form-group">
              <label>Professional Bio & Teaching Methodology *</label>
              <textarea [(ngModel)]="form.bioSummary" name="bioSummary" rows="4" placeholder="Briefly describe your teaching experience and approach..." required></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn-primary" [disabled]="submitting()">
                @if (submitting()) { Submitting... } @else { Submit Application for Screening }
              </button>
            </div>
          </form>
        } @else {
          <div class="success-box">
            <h2>🎉 Application Submitted Successfully!</h2>
            <p>Your application status is <strong>Pending Document Screening</strong>.</p>
            <p>Our academic board will review your CV and credentials. You will receive an email update at <strong>{{ form.email }}</strong> with your login credentials once approved.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .teacher-apply-page { padding: 1.5rem; max-width: 850px; margin: 0 auto; }
    .page-header h1 { color: var(--color-primary); margin-bottom: 0.25rem; font-size: 1.75rem; }
    .page-header p { color: var(--color-muted); margin-bottom: 1.5rem; }
    .apply-card { background: var(--color-surface); border: 1px solid var(--color-border); padding: 1.5rem; border-radius: 14px; box-shadow: var(--shadow-card); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1rem; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: var(--color-text); }
    .form-group input, .form-group textarea, .form-group select { padding: 0.65rem; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); }
    .phone-input-container { display: flex; gap: 0.5rem; }
    .country-code-select { flex: 0 0 150px; font-weight: 600; cursor: pointer; }
    .phone-input-container input { flex: 1; }
    .form-actions { margin-top: 1.5rem; text-align: right; }
    .btn-primary { background: var(--color-accent); color: #fff; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .success-box { text-align: center; padding: 2rem; }
    .success-box h2 { color: var(--color-success); margin-bottom: 0.5rem; }
  `]
})
export class TeacherApplyComponent {
  countryList = COUNTRY_PHONE_LIST;
  selectedCountryCode = '+251';
  phoneNumberInput = '';

  submitting = signal<boolean>(false);
  submitted = signal<boolean>(false);

  form = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    specialization: '',
    yearsOfExperience: 3,
    cvDocumentUrl: '',
    backgroundDocUrl: '',
    bioSummary: ''
  };

  private teacherService = inject(TeacherApplicationService);
  private toastService = inject(ToastService);

  onSubmitApplication(): void {
    if (!this.form.firstName || !this.form.email || !this.form.specialization || !this.phoneNumberInput) {
      this.toastService.show('Please fill in required fields including phone number.', 'error');
      return;
    }

    this.form.phoneNumber = `${this.selectedCountryCode} ${this.phoneNumberInput.trim()}`;

    this.submitting.set(true);
    this.teacherService.applyTeacher(this.form).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.submitted.set(true);
        this.toastService.show(res.message, 'success');
      },
      error: (err) => {
        this.submitting.set(false);
        this.toastService.show(err.error?.message || 'Application submission failed.', 'error');
      }
    });
  }
}
