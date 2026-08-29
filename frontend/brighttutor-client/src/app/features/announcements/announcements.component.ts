import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnnouncementService } from '../../services/announcement.service';
import { NotificationService } from '../../services/notification.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';
import { AnnouncementDto, CreateAnnouncementRequest } from '../../models/announcement.model';
import { SearchableSelectComponent, SelectOption } from '../../components/searchable-select/searchable-select.component';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: './announcements.component.html',
  styleUrl: './announcements.component.scss'
})
export class AnnouncementsComponent implements OnInit {
  private announcementService = inject(AnnouncementService);
  private notificationService = inject(NotificationService);
  private userService = inject(UserService);
  private toast = inject(ToastService);
  public authService = inject(AuthService);

  activeTab = signal<'bulletin' | 'direct'>('bulletin');

  // Campus Bulletins State
  announcements = signal<AnnouncementDto[]>([]);
  loading = signal<boolean>(true);
  selectedTargetFilter = signal<string>('');

  isCreateModalOpen = signal<boolean>(false);
  announcementForm: CreateAnnouncementRequest = {
    title: '',
    content: '',
    targetRole: null
  };
  submitting = signal<boolean>(false);
  modalError = signal<string | null>(null);

  // Direct Notification Dispatcher State
  userOptions = signal<SelectOption[]>([]);
  selectedNotifUserId = signal<string>('');
  notifForm = {
    type: 1,
    title: '',
    message: ''
  };
  sendingNotif = signal<boolean>(false);
  notifResult = signal<string | null>(null);
  notifError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAnnouncements();
    if (this.authService.isAdmin()) {
      this.loadUsers();
    }
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        const opts: SelectOption[] = users.map(u => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          subtext: `${u.email} (${u.role === 1 ? 'Admin' : u.role === 2 ? 'Teacher' : u.role === 3 ? 'Student' : 'Parent'})`
        }));
        this.userOptions.set(opts);
        if (opts.length > 0 && !this.selectedNotifUserId()) {
          this.selectedNotifUserId.set(opts[0].id);
        }
      },
      error: () => {}
    });
  }

  loadAnnouncements(): void {
    this.loading.set(true);
    let roleVal: number | undefined;

    if (this.authService.isAdmin()) {
      roleVal = this.selectedTargetFilter() ? Number(this.selectedTargetFilter()) : undefined;
    } else if (this.authService.isTeacher()) {
      roleVal = 2;
    } else if (this.authService.isStudent()) {
      roleVal = 3;
    } else if (this.authService.isParent()) {
      roleVal = 4;
    }

    this.announcementService.getAnnouncements(roleVal).subscribe({
      next: (data) => {
        this.announcements.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  onFilterChange(roleStr: string): void {
    this.selectedTargetFilter.set(roleStr);
    this.loadAnnouncements();
  }

  openCreateModal(): void {
    this.announcementForm = {
      title: '',
      content: '',
      targetRole: null
    };
    this.modalError.set(null);
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  submitAnnouncement(): void {
    this.modalError.set(null);
    if (!this.announcementForm.title.trim() || !this.announcementForm.content.trim()) {
      this.modalError.set('Please provide both Title and Notice Content.');
      return;
    }

    const currentUserId = this.authService.currentUser()?.userId;

    this.submitting.set(true);
    this.announcementService.createAnnouncement({
      title: this.announcementForm.title.trim(),
      content: this.announcementForm.content.trim(),
      targetRole: this.announcementForm.targetRole ? Number(this.announcementForm.targetRole) : null,
      createdByUserId: currentUserId
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeCreateModal();
        this.toast.showSuccess('Announcement broadcasted successfully!');
        this.loadAnnouncements();
      },
      error: (err) => {
        this.submitting.set(false);
        const errs = err?.error?.errors;
        let errMsg = 'Failed to publish announcement.';
        if (errs) {
          errMsg = Array.isArray(errs) ? errs.join(', ') : typeof errs === 'object' ? Object.values(errs).flat().join(', ') : String(errs);
        } else if (err?.error?.message) {
          errMsg = err.error.message;
        } else if (typeof err?.error === 'string') {
          errMsg = err.error;
        }
        this.modalError.set(errMsg);
      }
    });
  }

  onNotifUserSelected(id: string): void {
    this.selectedNotifUserId.set(id);
  }

  submitSendNotification(): void {
    this.notifError.set(null);
    this.notifResult.set(null);

    const targetId = this.selectedNotifUserId();
    if (!targetId) {
      this.notifError.set('Please select a target recipient.');
      return;
    }

    if (!this.notifForm.title.trim() || !this.notifForm.message.trim()) {
      this.notifError.set('Please fill in both Alert Subject and Notification Message.');
      return;
    }

    this.sendingNotif.set(true);

    this.notificationService.sendNotification({
      userId: targetId,
      title: this.notifForm.title.trim(),
      message: this.notifForm.message.trim(),
      type: Number(this.notifForm.type)
    }).subscribe({
      next: () => {
        this.sendingNotif.set(false);
        this.notifResult.set('Direct notification dispatched successfully to user inbox!');
        this.toast.showSuccess('Notification sent successfully!');
        this.notifForm.title = '';
        this.notifForm.message = '';
      },
      error: (err) => {
        this.sendingNotif.set(false);
        const errMsg = err?.error?.message || err?.error || 'Failed to dispatch notification.';
        this.notifError.set(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
        this.toast.showError(errMsg);
      }
    });
  }

  getTargetRoleLabel(role?: any): string {
    if (role === 1 || role === '1' || role === 'Admin') return '👑 Admins Only';
    if (role === 2 || role === '2' || role === 'Teacher') return '👨‍🏫 Teachers Only';
    if (role === 3 || role === '3' || role === 'Student') return '🎓 Students Only';
    if (role === 4 || role === '4' || role === 'Parent') return '👨‍👩‍👧 Parents Only';
    return '🌐 All Campus & Roles';
  }

  getTargetRoleClass(role?: any): string {
    if (role === 1 || role === '1' || role === 'Admin') return 'role-admin';
    if (role === 2 || role === '2' || role === 'Teacher') return 'role-teacher';
    if (role === 3 || role === '3' || role === 'Student') return 'role-student';
    if (role === 4 || role === '4' || role === 'Parent') return 'role-parent';
    return 'role-all';
  }
}
