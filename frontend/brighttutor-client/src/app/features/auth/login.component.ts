import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-fullscreen">
      <div class="glass-card">
        <div class="login-header">
          <div class="logo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
              <path d="M5 13.18v4.27l7 3.82 7-3.82v-4.27l-7 3.82-7-3.82z"/>
            </svg>
          </div>
          <h2>BrightTutor</h2>
          <p>Welcome to BrightTutor Academic Portal</p>
        </div>

        <form (ngSubmit)="onLogin()" class="login-form">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="email"
              placeholder="Enter your email address"
              required
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              [(ngModel)]="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" class="btn-submit" [disabled]="loading()">
            @if (loading()) {
              Signing In...
            } @else {
              Sign In
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      padding: 1.5rem;
    }
    .glass-card {
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(12px);
      border-radius: 20px;
      padding: 2.75rem 2.5rem;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .logo {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      border-radius: 14px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
      svg { width: 30px; height: 30px; }
    }
    .login-header h2 { font-size: 1.75rem; color: #0f172a; margin: 0 0 0.35rem 0; font-weight: 800; letter-spacing: -0.02em; }
    .login-header p { color: #64748b; font-size: 0.9rem; margin: 0; }
    .form-group { margin-bottom: 1.25rem; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 0.4rem; }
    .form-group input {
      width: 100%;
      padding: 0.85rem 1rem;
      border-radius: 10px;
      border: 1px solid #cbd5e1;
      font-size: 0.95rem;
      transition: border-color 0.2s, box-shadow 0.2s;
      &:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }
    }
    .btn-submit {
      width: 100%;
      padding: 0.9rem;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      margin-top: 0.5rem;
      transition: transform 0.15s, box-shadow 0.2s;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
      &:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45); }
      &:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal<boolean>(false);

  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private router = inject(Router);

  onLogin(): void {
    if (!this.email || !this.password) {
      this.toastService.showError('Please enter both email address and password.');
      return;
    }

    this.loading.set(true);
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.toastService.showSuccess(`Welcome back, ${user.firstName}!`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        const errorMsg = err.error?.message || 'Invalid credentials. Please try again.';
        this.toastService.showError(errorMsg);
      }
    });
  }
}
