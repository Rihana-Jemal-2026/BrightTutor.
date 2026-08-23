import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ToastService } from './services/toast.service';
import { NotificationService } from './services/notification.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  title = 'BrightTutor Academic Portal';
  toastService = inject(ToastService);
  notificationService = inject(NotificationService);
  authService = inject(AuthService);
  private router = inject(Router);

  isSidebarCollapsed = signal<boolean>(false);
  isNotificationDropdownOpen = signal<boolean>(false);
  isProfileModalOpen = signal<boolean>(false);
  changingPassword = signal<boolean>(false);

  passwordForm = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(val => !val);
  }

  toggleNotificationDropdown(): void {
    this.isNotificationDropdownOpen.update(val => !val);
  }

  closeNotificationDropdown(): void {
    this.isNotificationDropdownOpen.set(false);
  }

  openProfileModal(): void {
    this.passwordForm = { oldPassword: '', newPassword: '', confirmPassword: '' };
    this.isProfileModalOpen.set(true);
  }

  closeProfileModal(): void {
    this.isProfileModalOpen.set(false);
  }

  onChangePassword(): void {
    if (!this.passwordForm.oldPassword || !this.passwordForm.newPassword) {
      this.toastService.showError('Please fill in both current and new password.');
      return;
    }

    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.toastService.showError('New passwords do not match.');
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.toastService.showError('New password must be at least 6 characters.');
      return;
    }

    this.changingPassword.set(true);
    this.authService.changePassword({
      oldPassword: this.passwordForm.oldPassword,
      newPassword: this.passwordForm.newPassword
    }).subscribe({
      next: () => {
        this.changingPassword.set(false);
        this.closeProfileModal();
        this.toastService.showSuccess('Password updated successfully!');
      },
      error: (err) => {
        this.changingPassword.set(false);
        const errorMsg = err.error?.message || 'Failed to change password. Verify your current password.';
        this.toastService.showError(errorMsg);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.toastService.showInfo('You have been logged out.');
    this.router.navigate(['/login']);
  }
}