import { Component, OnInit, signal, inject, ElementRef, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { ToastService } from './services/toast.service';
import { NotificationService, NotificationDto } from './services/notification.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  title = 'BrightTutor Academic Portal';
  toastService = inject(ToastService);
  notificationService = inject(NotificationService);
  authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  isSidebarCollapsed = signal<boolean>(false);
  isNotificationDropdownOpen = signal<boolean>(false);
  isProfileModalOpen = signal<boolean>(false);
  changingPassword = signal<boolean>(false);
  isDarkMode = signal<boolean>(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const notifElem = this.elementRef.nativeElement.querySelector('.notification-wrapper');
    if (notifElem && !notifElem.contains(event.target)) {
      this.isNotificationDropdownOpen.set(false);
    }
  }

  ngOnInit(): void {
    if (window.innerWidth <= 768) {
      this.isSidebarCollapsed.set(true);
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      this.enableDarkMode();
    } else {
      this.enableLightMode();
    }

    const user = this.authService.currentUser();
    if (user?.userId) {
      this.fetchUserNotifications(user.userId);
    }
  }

  toggleTheme(): void {
    if (this.isDarkMode()) {
      this.enableLightMode();
    } else {
      this.enableDarkMode();
    }
  }

  private enableDarkMode(): void {
    this.isDarkMode.set(true);
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }

  private enableLightMode(): void {
    this.isDarkMode.set(false);
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  }

  passwordForm = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user?.userId) {
        this.fetchUserNotifications(user.userId);
      }
    });
  }

  fetchUserNotifications(userId: string): void {
    this.notificationService.loadNotifications(userId).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.update(val => !val);
  }

  closeSidebarOnMobile(): void {
    if (window.innerWidth <= 768) {
      this.isSidebarCollapsed.set(true);
    }
  }

  toggleNotificationDropdown(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    const opening = !this.isNotificationDropdownOpen();
    this.isNotificationDropdownOpen.set(opening);
    if (opening) {
      const user = this.authService.currentUser();
      if (user?.userId) {
        this.fetchUserNotifications(user.userId);
      }
    }
  }

  closeNotificationDropdown(): void {
    this.isNotificationDropdownOpen.set(false);
  }

  isUnread(status: any): boolean {
    return status === 1 || status === '1' || status === 'Unread';
  }

  onNotificationClick(item: NotificationDto): void {
    if (this.isUnread(item.status)) {
      this.notificationService.markAsRead(item.id).subscribe();
    }
    this.closeNotificationDropdown();
    if (item.type === 3 || item.type === 'GeneralAnnouncement' || item.title.includes('Notice') || item.title.includes('Announcement')) {
      this.router.navigate(['/announcements']);
    } else if (item.type === 2 || item.type === 'ScheduleAlert' || item.title.includes('Schedule')) {
      this.router.navigate(['/schedules']);
    } else if (item.type === 1 || item.type === 'AttendanceAlert' || item.title.includes('Attendance')) {
      this.router.navigate(['/view-group-attendance']);
    }
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