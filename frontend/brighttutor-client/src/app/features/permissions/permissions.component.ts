import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PermissionService, PermissionDto } from '../../services/permission.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="permissions-page">
      <div class="page-header">
        <div>
          <h1>🔐 Dynamic Role & Permission Matrix</h1>
          <p>Assign and manage granular action permissions per user role.</p>
        </div>
        <div class="role-selector">
          <label for="roleSelect">Selected Role:</label>
          <select id="roleSelect" [ngModel]="selectedRole()" (ngModelChange)="onRoleChange($event)" class="form-control">
            <option [value]="1">👑 Admin</option>
            <option [value]="2">👨‍🏫 Teacher</option>
            <option [value]="3">🎓 Student</option>
            <option [value]="4">👨‍👩‍👧 Parent</option>
          </select>
        </div>
      </div>

      <div class="table-card">
        @if (loading()) {
          <div class="loading">Loading permissions matrix...</div>
        } @else {
          <table class="matrix-table">
            <thead>
              <tr>
                <th>Granted</th>
                <th>Module</th>
                <th>Permission Name</th>
                <th>System Code</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              @for (perm of permissions(); track perm.id) {
                <tr [class.assigned]="isAssigned(perm.code)">
                  <td class="checkbox-col">
                    <input
                      type="checkbox"
                      [checked]="isAssigned(perm.code)"
                      (change)="togglePermission(perm.code)"
                    />
                  </td>
                  <td><span class="module-badge">{{ perm.module }}</span></td>
                  <td class="perm-name">{{ perm.name }}</td>
                  <td><code>{{ perm.code }}</code></td>
                  <td class="desc">{{ perm.description || 'System action permission' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty">No system permissions found.</td></tr>
              }
            </tbody>
          </table>

          <div class="card-footer">
            <button type="button" class="btn-save" (click)="saveRolePermissions()" [disabled]="saving()">
              @if (saving()) { Saving Matrix... } @else { Save Role Permissions }
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .permissions-page { padding: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; color: #1e293b; margin-bottom: 0.25rem; }
    .page-header p { color: #64748b; margin: 0; }
    .role-selector { display: flex; align-items: center; gap: 0.6rem; font-weight: 600; color: #334155; }
    .role-selector select { padding: 0.5rem 0.85rem; border-radius: 8px; border: 1px solid #cbd5e1; font-weight: 600; font-size: 0.9rem; }
    .table-card { background: white; border-radius: 12px; padding: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .matrix-table { width: 100%; border-collapse: collapse; text-align: left; }
    .matrix-table th, .matrix-table td { padding: 0.875rem 1rem; border-bottom: 1px solid #f1f5f9; }
    .matrix-table th { background: #f8fafc; font-weight: 600; color: #475569; font-size: 0.85rem; text-transform: uppercase; }
    .matrix-table tr.assigned { background: #f0fdf4; }
    .checkbox-col input { width: 18px; height: 18px; cursor: pointer; }
    .module-badge { background: #eff6ff; color: #2563eb; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600; font-size: 0.75rem; }
    .perm-name { font-weight: 600; color: #0f172a; }
    code { background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; font-size: 0.85rem; color: #475569; }
    .desc { color: #64748b; font-size: 0.875rem; }
    .card-footer { display: flex; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid #f1f5f9; margin-top: 1rem; }
    .btn-save { background: #059669; color: white; border: none; padding: 0.7rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-save:hover { background: #047857; }
    .loading, .empty { text-align: center; color: #94a3b8; padding: 2rem; }
  `]
})
export class PermissionsComponent implements OnInit {
  permissions = signal<PermissionDto[]>([]);
  rolePermissions = signal<string[]>([]);
  selectedRole = signal<number>(1); // Default to Admin
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);

  private permissionService = inject(PermissionService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.loadAllPermissions();
  }

  loadAllPermissions(): void {
    this.loading.set(true);
    this.permissionService.getPermissions().subscribe({
      next: (perms) => {
        this.permissions.set(perms);
        this.loadRolePermissions(this.selectedRole());
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.showError('Could not load permissions. Ensure you are signed in.');
      }
    });
  }

  loadRolePermissions(role: number): void {
    this.permissionService.getRolePermissions(role).subscribe({
      next: (assignedCodes) => {
        this.rolePermissions.set(assignedCodes);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onRoleChange(role: any): void {
    const r = +role;
    this.selectedRole.set(r);
    this.loadRolePermissions(r);
  }

  isAssigned(code: string): boolean {
    return this.rolePermissions().includes(code);
  }

  togglePermission(code: string): void {
    const current = this.rolePermissions();
    if (current.includes(code)) {
      this.rolePermissions.set(current.filter(c => c !== code));
    } else {
      this.rolePermissions.set([...current, code]);
    }
  }

  saveRolePermissions(): void {
    this.saving.set(true);
    this.permissionService.assignPermissionsToRole(this.selectedRole(), this.rolePermissions()).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.showSuccess('Role permissions saved successfully!');
      },
      error: () => {
        this.saving.set(false);
        this.toast.showError('Failed to save role permissions.');
      }
    });
  }
}
