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
          <h1>👥 System Users Management</h1>
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
                        ✏️
                      </button>
                    }

                    @if (isSuperAdmin(user)) {
                      <span class="protected-pill" title="Super Admin Account - Protected System Record">🛡️ Super Admin</span>
                    } @else {
                      <button
                        type="button"
                        class="icon-action-btn toggle"
                        [class.deactivate]="isUserActive(user)"
                        [title]="isUserActive(user) ? 'Deactivate User Account' : 'Activate User Account'"
                        (click)="toggleUserStatus(user)"
                      >
                        {{ isUserActive(user) ? '⏸️' : '▶️' }}
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
                  <input id="password" type="password" name="password" [(ngModel)]="newUser.password" placeholder="••••••••" required />
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
              <h3>✏️ Edit User Details</h3>
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
    .page-header h1 { font-size: 1.75rem; color: #1e293b; margin-bottom: 0.25rem; }
    .page-header p { color: #64748b; margin: 0; }
    .btn-create-user { background: #2563eb; color: white; border: none; padding: 0.65rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn-create-user:hover { background: #1d4ed8; }
    .table-card { background: white; border-radius: 12px; padding: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; }
    .data-table th, .data-table td { padding: 0.875rem 1rem; border-bottom: 1px solid #f1f5f9; }
    .data-table th { background: #f8fafc; font-weight: 600; color: #475569; font-size: 0.85rem; text-transform: uppercase; }
    .user-name { font-weight: 600; color: #0f172a; }
    .role-badge { padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
    .role-badge.admin { background: #fee2e2; color: #dc2626; }
    .role-badge.teacher { background: #e0e7ff; color: #4338ca; }
    .role-badge.student { background: #d1fae5; color: #059669; }
    .role-badge.parent { background: #fef3c7; color: #d97706; }
    .status-badge { padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem; background: #fee2e2; color: #dc2626; font-weight: 600; }
    .status-badge.active { background: #d1fae5; color: #059669; }
    .text-right { text-align: right; }
    .actions-cell { display: flex; justify-content: flex-end; gap: 0.4rem; align-items: center; }
    .icon-action-btn { border: 1px solid #cbd5e1; background: #f8fafc; padding: 0.4rem 0.65rem; border-radius: 8px; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; }
    .icon-action-btn:hover { background: #e2e8f0; transform: scale(1.05); }
    .icon-action-btn.edit { border-color: #bfdbfe; background: #eff6ff; }
    .icon-action-btn.toggle.deactivate { border-color: #fca5a5; background: #fef2f2; }
    .protected-pill { font-size: 0.75rem; background: #f1f5f9; color: #475569; padding: 0.25rem 0.6rem; border-radius: 20px; font-weight: 600; border: 1px solid #cbd5e1; }
    .empty-state { text-align: center; color: #94a3b8; padding: 2.5rem; }

    /* Modal Styles */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; }
    .modal-card { background: white; border-radius: 14px; width: 100%; max-width: 500px; padding: 1.75rem; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .modal-header h3 { margin: 0; font-size: 1.25rem; color: #0f172a; }
    .close-btn { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem; }
    .form-group input, .form-group select { width: 100%; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
    .btn-cancel { background: #e2e8f0; color: #475569; border: none; padding: 0.6rem 1rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
    .btn-save { background: #2563eb; color: white; border: none; padding: 0.6rem 1.25rem; border-radius: 6px; font-weight: 600; cursor: pointer; }
  `]
})
export class UsersComponent implements OnInit {
  users = signal<UserDto[]>([]);
  loading = signal<boolean>(true);
  isCreateModalOpen = signal<boolean>(false);
  isEditModalOpen = signal<boolean>(false);
  submitting = signal<boolean>(false);

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
