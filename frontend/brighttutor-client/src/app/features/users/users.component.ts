import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, UserDto, CreateUserRequest } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-page">
      <div class="page-header">
        <div>
          <h1>System Users Management</h1>
          <p>Manage Admin, Teacher, Student, and Parent accounts.</p>
        </div>
        <button type="button" class="btn-create-user" (click)="openCreateModal()">
          + Add New User
        </button>
      </div>

      <!-- Users Data Table -->
      <div class="table-card">
        @if (loading()) {
          <div class="loading">Loading system users...</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th>User Name</th>
                <th>Email Address</th>
                <th>Phone Number</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined Date</th>
                <th class="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td class="user-name">{{ user.firstName }} {{ user.lastName }}</td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.phoneNumber || '—' }}</td>
                  <td><span class="role-badge" [class]="getRoleClass(user.role)">{{ getRoleName(user.role) }}</span></td>
                  <td>
                    <span class="status-badge" [class.active]="isUserActive(user)">
                      {{ isUserActive(user) ? 'Active' : 'Deactivated' }}
                    </span>
                  </td>
                  <td>{{ user.createdAt | date:'mediumDate' }}</td>
                  <td class="text-right actions-cell">
                    @if (canEditUser(user)) {
                      <button
                        type="button"
                        class="icon-action-btn edit"
                        title="Edit User Details"
                        (click)="openEditModal(user)"
                      >
                        <svg class="ui-icon action-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3a2.1 2.1 0 0 1 3 3L7 18l-4 1 1-4L16 3ZM14 5l3 3"/></svg>
                      </button>
                    }

                    @if (isSuperAdmin(user)) {
                      <span class="protected-pill" title="Super Admin Account - Protected System Record"> Super Admin</span>
                    } @else {
                      <button
                        type="button"
                        class="icon-action-btn toggle"
                        [class.deactivate]="isUserActive(user)"
                        [title]="isUserActive(user) ? 'Deactivate User Account' : 'Activate User Account'"
                        (click)="toggleUserStatus(user)"
                      >
                        <svg class="ui-icon action-glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="isUserActive(user) ? 'M8 5v14M16 5v14' : 'm8 5 11 7-11 7V5Z'"/></svg>
                      </button>
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="empty-state">No users registered yet. Click "+ Add New User" above to create one.</td></tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Create User Modal -->
      @if (isCreateModalOpen()) {
        <div class="modal-overlay" (click)="closeCreateModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Create New User Account</h3>
              <button type="button" class="close-btn" (click)="closeCreateModal()">&times;</button>
            </div>

            <form (ngSubmit)="onCreateUser()" class="modal-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="firstName">First Name</label>
                  <input id="firstName" name="firstName" [(ngModel)]="newUser.firstName" placeholder="e.g. John" required />
                </div>
                <div class="form-group">
                  <label for="lastName">Last Name</label>
                  <input id="lastName" name="lastName" [(ngModel)]="newUser.lastName" placeholder="e.g. Doe" required />
                </div>
              </div>

              <div class="form-group">
                <label for="email">Email Address</label>
                <input id="email" type="email" name="email" [(ngModel)]="newUser.email" placeholder="e.g. user@brighttutor.com" required />
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="password">Initial Password</label>
                  <div class="password-input-wrapper">
                    <input
                      id="password"
                      [type]="showNewUserPassword() ? 'text' : 'password'"
                      name="password"
                      [(ngModel)]="newUser.password"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      class="btn-toggle-pass"
                      (click)="showNewUserPassword.set(!showNewUserPassword())"
                      title="Toggle Password Visibility"
                    >
                      {{ showNewUserPassword() ? 'Hide' : 'Show' }}
                    </button>
                  </div>
                </div>

                <div class="form-group">
                  <label for="phoneNumber">Phone Number</label>
                  <input id="phoneNumber" name="phoneNumber" [(ngModel)]="newUser.phoneNumber" placeholder="+1234567890" />
                </div>
              </div>

              <div class="form-group">
                <label for="role">User Role</label>
                <select id="role" name="role" [(ngModel)]="newUser.role" class="form-control">
                  <option [ngValue]="1">Admin</option>
                  <option [ngValue]="2">Teacher</option>
                  <option [ngValue]="3">Student</option>
                  <option [ngValue]="4">Parent</option>
                </select>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-cancel" (click)="closeCreateModal()">Cancel</button>
                <button type="submit" class="btn-save" [disabled]="submitting()">
                  @if (submitting()) { Creating... } @else { Create Account }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Edit User Modal -->
      @if (isEditModalOpen() && editingUser) {
        <div class="modal-overlay" (click)="closeEditModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Edit User Details</h3>
              <button type="button" class="close-btn" (click)="closeEditModal()">&times;</button>
            </div>

            <form (ngSubmit)="onUpdateUser()" class="modal-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="editFirstName">First Name</label>
                  <input id="editFirstName" name="editFirstName" [(ngModel)]="editingUser.firstName" required />
                </div>
                <div class="form-group">
                  <label for="editLastName">Last Name</label>
                  <input id="editLastName" name="editLastName" [(ngModel)]="editingUser.lastName" required />
                </div>
              </div>

              <div class="form-group">
                <label for="editEmail">Email Address</label>
                <input id="editEmail" type="email" name="editEmail" [(ngModel)]="editingUser.email" required />
              </div>

              <div class="form-group">
                <label for="editPhoneNumber">Phone Number</label>
                <input id="editPhoneNumber" name="editPhoneNumber" [(ngModel)]="editingUser.phoneNumber" placeholder="+1234567890" />
              </div>

              <div class="form-group">
                <label for="editRole">User Role</label>
                <select id="editRole" name="editRole" [(ngModel)]="editingUser.role" class="form-control">
                  <option [ngValue]="1">Admin</option>
                  <option [ngValue]="2">Teacher</option>
                  <option [ngValue]="3">Student</option>
                  <option [ngValue]="4">Parent</option>
                </select>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn-cancel" (click)="closeEditModal()">Cancel</button>
                <button type="submit" class="btn-save" [disabled]="submitting()">
                  @if (submitting()) { Saving... } @else { Save Changes }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .users-page { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; color: var(--color-primary); margin-bottom: 0.25rem; }
    .page-header p { color: var(--color-muted); margin: 0; }
    .btn-create-user { background: var(--color-action); color: white; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn-create-user:hover { background: var(--color-action); }
    .table-card { background: var(--color-surface); border-radius: var(--radius-lg); padding: 1rem; box-shadow: var(--shadow-card); border: 1px solid var(--color-border); }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th, .data-table td { padding: 0.875rem 1rem; border-bottom: 1px solid var(--color-border); color: var(--color-text); }
    .data-table th { background: var(--color-bg); font-weight: 600; color: var(--color-muted); font-size: 0.85rem; text-transform: uppercase; }
    .user-name { font-weight: 600; color: var(--color-text); }
    .role-badge { padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .role-badge.admin { background: var(--color-error-bg); color: var(--color-error); }
    .role-badge.teacher { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
    .role-badge.student { background: var(--color-success-bg); color: var(--color-success); }
    .role-badge.parent { background: var(--status-late-bg); color: var(--status-late); }
    .status-badge { padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.75rem; background: var(--color-error-bg); color: var(--color-error); font-weight: 600; border: 1px solid rgba(239, 68, 68, 0.3); }
    .status-badge.active { background: var(--color-success-bg); color: var(--color-success); border: 1px solid rgba(var(--color-accent-rgb), 0.3); }
    .text-right { text-align: right; }
    .actions-cell { display: flex; justify-content: flex-end; gap: 0.4rem; align-items: center; }
    .icon-action-btn { border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); padding: 0.4rem 0.65rem; border-radius: 8px; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; }
    .icon-action-btn:hover { background: var(--color-surface); transform: scale(1.05); }
    .icon-action-btn.edit { border-color: var(--color-accent-bright); background: rgba(var(--color-accent-rgb), 0.1); }
    .icon-action-btn.toggle { border-color: var(--color-border); }
    .icon-action-btn.toggle.deactivate { border-color: rgba(239, 68, 68, 0.4); background: var(--color-error-bg); color: var(--color-error); }
    .protected-pill { font-size: 0.75rem; background: var(--color-bg); color: var(--color-muted); padding: 0.25rem 0.6rem; border-radius: 20px; font-weight: 600; border: 1px solid var(--color-border); }
    .empty-state { text-align: center; color: var(--color-muted); padding: 2.5rem; }

    /* Modal Styles */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 10000; backdrop-filter: blur(4px); }
    .modal-card { background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border); border-radius: var(--radius-lg); width: 100%; max-width: 500px; padding: 1.75rem; box-shadow: var(--shadow-card-hover); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .modal-header h3 { margin: 0; font-size: 1.25rem; color: var(--color-text); }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: var(--color-muted); cursor: pointer; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: var(--color-text); margin-bottom: 0.35rem; }
    .form-group input, .form-group select { width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg); color: var(--color-text); font-size: 0.9rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .password-input-wrapper { position: relative; display: flex; align-items: center; }
    .password-input-wrapper input { padding-right: 2.2rem; }
    .btn-toggle-pass { position: absolute; right: 6px; background: none; border: none; font-size: 0.9rem; cursor: pointer; padding: 2px 4px; border-radius: 4px; color: var(--color-muted); }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
    .btn-cancel { background: var(--color-bg); color: var(--color-muted); border: 1px solid var(--color-border); padding: 0.6rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-save { background: var(--color-action); color: white; border: none; padding: 0.6rem 1.25rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-save:hover { background: var(--color-action); }
  `]
})
export class UsersComponent implements OnInit {
  users = signal<UserDto[]>([]);
  loading = signal<boolean>(true);
  isCreateModalOpen = signal<boolean>(false);
  isEditModalOpen = signal<boolean>(false);
  submitting = signal<boolean>(false);
  showNewUserPassword = signal<boolean>(false);

  newUser: CreateUserRequest = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: 3
  };

  editingUser: any = null;

  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.users.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  openCreateModal(): void {
    this.newUser = { firstName: '', lastName: '', email: '', password: '', phoneNumber: '', role: 3 };
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    this.isCreateModalOpen.set(false);
  }

  openEditModal(user: UserDto): void {
    this.editingUser = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: typeof user.role === 'number' ? user.role : this.parseRoleNumber(user.role)
    };
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    this.editingUser = null;
    this.isEditModalOpen.set(false);
  }

  onCreateUser(): void {
    if (!this.newUser.firstName || !this.newUser.lastName || !this.newUser.email || !this.newUser.password) {
      this.toast.showError('Please fill in all required fields.');
      return;
    }

    const payload: CreateUserRequest = {
      ...this.newUser,
      role: Number(this.newUser.role)
    };

    this.submitting.set(true);
    this.userService.createUser(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeCreateModal();
        this.toast.showSuccess(`User account created successfully!`);
        this.loadUsers();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.showError(this.extractErrorMessage(err));
      }
    });
  }

  onUpdateUser(): void {
    if (!this.editingUser.firstName || !this.editingUser.lastName || !this.editingUser.email) {
      this.toast.showError('Please fill in required fields.');
      return;
    }

    const payload = {
      firstName: this.editingUser.firstName,
      lastName: this.editingUser.lastName,
      email: this.editingUser.email,
      phoneNumber: this.editingUser.phoneNumber,
      role: Number(this.editingUser.role)
    };

    this.submitting.set(true);
    this.userService.updateUser(this.editingUser.id, payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.closeEditModal();
        this.toast.showSuccess('User profile updated successfully!');
        this.loadUsers();
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.showError(this.extractErrorMessage(err));
      }
    });
  }

  isSuperAdmin(user: UserDto): boolean {
    return user.email?.toLowerCase() === 'admin@brighttutor.com';
  }

  canEditUser(user: UserDto): boolean {
    const currentEmail = this.authService.currentUser()?.email?.toLowerCase();
    // Super Admin account can only be edited by Super Admin themselves
    if (this.isSuperAdmin(user)) {
      return currentEmail === 'admin@brighttutor.com';
    }
    return true;
  }

  isUserActive(user: any): boolean {
    return user.status === 1 || String(user.status).toLowerCase() === 'active';
  }

  toggleUserStatus(user: UserDto): void {
    if (this.isSuperAdmin(user)) {
      this.toast.showError('Super Admin account cannot be deactivated.');
      return;
    }

    const isActive = this.isUserActive(user);
    const newStatus = isActive ? 0 : 1; // 0 = Inactive/Deactivated, 1 = Active
    const actionText = isActive ? 'deactivated' : 'activated';

    this.userService.updateUserStatus(user.id, newStatus).subscribe({
      next: () => {
        this.toast.showSuccess(`User ${user.firstName} ${user.lastName} has been ${actionText}.`);
        this.loadUsers();
      },
      error: () => {
        this.toast.showError(`Failed to update status for ${user.firstName}.`);
      }
    });
  }

  getRoleName(role: any): string {
    const val = String(role).toLowerCase();
    if (val === '1' || val === 'admin') return 'Admin';
    if (val === '2' || val === 'teacher') return 'Teacher';
    if (val === '3' || val === 'student') return 'Student';
    if (val === '4' || val === 'parent') return 'Parent';
    return 'User';
  }

  getRoleClass(role: any): string {
    const val = String(role).toLowerCase();
    if (val === '1' || val === 'admin') return 'admin';
    if (val === '2' || val === 'teacher') return 'teacher';
    if (val === '3' || val === 'student') return 'student';
    if (val === '4' || val === 'parent') return 'parent';
    return '';
  }

  private parseRoleNumber(roleStr: any): number {
    const val = String(roleStr).toLowerCase();
    if (val === 'admin') return 1;
    if (val === 'teacher') return 2;
    if (val === 'student') return 3;
    if (val === 'parent') return 4;
    return 3;
  }

  private extractErrorMessage(err: any): string {
    if (err?.error?.errors) {
      if (Array.isArray(err.error.errors) && err.error.errors.length > 0) {
        return err.error.errors.join(', ');
      }
      if (typeof err.error.errors === 'object') {
        const vals = Object.values(err.error.errors).flat();
        if (vals.length > 0) return vals.join(', ');
      }
    }
    if (typeof err?.error === 'string') return err.error;
    if (err?.error?.message && err.error.message !== 'Validation Failed') return err.error.message;
    if (err?.error?.detail) return err.error.detail;
    return err?.statusText || 'An error occurred processing the request.';
  }
}
