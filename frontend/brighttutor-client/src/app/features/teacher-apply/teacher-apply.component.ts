import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TeacherApplicationService } from '../../services/teacher-application.service';
import { ToastService } from '../../services/toast.service';
import { COUNTRY_PHONE_LIST } from '../../models/country-phone.data';

@Component({
  selector: 'app-teacher-apply',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="teacher-apply-page">
      <div class="header-nav-row">
        <a routerLink="/login" class="btn-back-login">← Back to Login Page</a>
      </div>

      <div class="page-header">
        <h1>Join BrightTutor as a Certified Educator</h1>
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
                  <div class="flag-badge" title="Selected Country Flag">
                    <img [src]="getSelectedCountryFlagUrl(selectedCountryCode)" [alt]="selectedCountryCode" class="flag-img" />
                  </div>
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
            <h2>Application Submitted Successfully!</h2>
            <p>Your application status is <strong>Pending Document Screening</strong>.</p>
            <p>Our academic board will review your CV and credentials. You will receive an email update at <strong>{{ form.email }}</strong> with your login credentials once approved.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .teacher-apply-page {
      padding: 1.5rem 1rem;
      max-width: 850px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }

    .page-header h1 {
      color: var(--color-primary);
      margin-bottom: 0.25rem;
      font-size: 1.75rem;
      font-weight: 800;
    }

    .page-header p {
      color: var(--color-muted);
      margin-bottom: 1.5rem;
    }

    .apply-card {
      background: var(--color-surface);
      border: 1.5px solid var(--color-border);
      padding: 1.75rem;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      width: 100%;
      box-sizing: border-box;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      margin-bottom: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      margin-bottom: 1rem;
      width: 100%;
      box-sizing: border-box;
    }

    .form-group label {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text);
    }

    .form-group input, .form-group textarea, .form-group select {
      width: 100%;
      box-sizing: border-box;
      padding: 0.7rem 0.85rem;
      border-radius: 8px;
      border: 1.5px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text);
      font-size: 0.95rem;
    }

    .phone-input-container {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      width: 100%;
      box-sizing: border-box;

      .flag-badge {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-bg);
        border: 1.5px solid var(--color-border);
        border-radius: 8px;
        padding: 0.35rem 0.5rem;
        height: 42px;
        box-sizing: border-box;
      }

      .flag-img {
        width: 24px;
        height: 16px;
        object-fit: cover;
        border-radius: 3px;
      }

      .country-code-select {
        width: 130px;
        flex-shrink: 0;
        font-weight: 600;
        cursor: pointer;
        height: 42px;
      }

      input {
        flex: 1;
        min-width: 0;
        width: 100%;
        height: 42px;
      }
    }

    .form-actions {
      margin-top: 1.5rem;
      text-align: right;
    }

    .btn-primary {
      background: var(--color-action);
      color: #fff;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }

    .success-box {
      text-align: center;
      padding: 2rem;
    }

    .success-box h2 {
      color: var(--color-success);
      margin-bottom: 0.5rem;
    }

    .header-nav-row { margin-bottom: 1rem; }
    .btn-back-login { display: inline-flex; align-items: center; gap: 0.4rem; background: var(--color-surface); color: var(--color-primary); border: 1.5px solid var(--color-border); padding: 0.55rem 1.1rem; border-radius: 10px; font-weight: 700; font-size: 0.9rem; text-decoration: none; box-shadow: var(--shadow-card); transition: all 0.2s; }
    .btn-back-login:hover { background: var(--color-action); color: white; border-color: var(--color-primary); transform: translateX(-3px); }

    @media (max-width: 768px) {
      .teacher-apply-page { padding: 1rem 0.5rem; }
      .apply-card { padding: 1.25rem; }
      .form-row { grid-template-columns: 1fr; gap: 0.75rem; }
      .form-actions button, .btn-primary { width: 100%; }
    }

    @media (max-width: 480px) {
      .phone-input-container {
        flex-wrap: wrap;
        .country-code-select {
          flex: 1;
          width: auto;
        }
        input {
          width: 100%;
          flex: 1 1 100%;
        }
      }
    }
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

  getSelectedCountryFlagUrl(dialCode: string): string {
    const item = this.countryList.find(c => c.dialCode === dialCode);
    return item ? item.flagUrl : 'https://flagcdn.com/w40/et.png';
  }

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
