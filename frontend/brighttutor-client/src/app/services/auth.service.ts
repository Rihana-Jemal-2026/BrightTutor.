import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginResponse {
  token: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: number | string;
  expiresAt: string;
}

export interface UserProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: number | string;
  status: number;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5198/api/auth';
  private permsUrl = 'http://localhost:5198/api/permissions';

  currentUser = signal<LoginResponse | null>(this.getStoredUser());
  userPermissions = signal<string[]>([]);
  isAuthenticated = computed(() => !!this.currentUser());

  isSuperAdmin = computed(() => {
    const user = this.currentUser();
    return user?.email === 'admin@brighttutor.com';
  });

  isAdmin = computed(() => {
    const user = this.currentUser();
    if (!user) return false;
    const r = String(user.role).toLowerCase();
    return user.email === 'admin@brighttutor.com' || r === '1' || r === 'admin' || r === 'superadmin';
  });

  isTeacher = computed(() => {
    const user = this.currentUser();
    if (!user) return false;
    const r = String(user.role).toLowerCase();
    return r === '2' || r === 'teacher';
  });

  isStudent = computed(() => {
    const user = this.currentUser();
    if (!user) return false;
    const r = String(user.role).toLowerCase();
    return r === '3' || r === 'student';
  });

  isParent = computed(() => {
    const user = this.currentUser();
    if (!user) return false;
    const r = String(user.role).toLowerCase();
    return r === '4' || r === 'parent';
  });

  getRoleName(): string {
    const user = this.currentUser();
    if (!user) return 'Guest';
    if (user.email === 'admin@brighttutor.com') return 'Super Admin';
    const r = String(user.role).toLowerCase();
    if (r === '1' || r === 'admin') return 'Administrator';
    if (r === '2' || r === 'teacher') return 'Teacher';
    if (r === '3' || r === 'student') return 'Student';
    if (r === '4' || r === 'parent') return 'Parent';
    return 'User';
  }

  hasPermission(code: string): boolean {
    if (this.isAdmin() || this.isSuperAdmin()) return true;
    const perms = this.userPermissions();
    if (perms.length === 0) {
      if (this.isTeacher()) {
        return ['courses.view', 'schedules.view', 'attendance.view', 'attendance.mark', 'notifications.view'].includes(code);
      }
      if (this.isStudent() || this.isParent()) {
        return ['courses.view', 'schedules.view', 'attendance.view', 'notifications.view'].includes(code);
      }
    }
    return perms.includes(code);
  }

  constructor(private http: HttpClient) {
    this.loadUserPermissions();
  }

  loadUserPermissions(): void {
    const user = this.currentUser();
    if (!user) return;
    let roleInt = 1;
    const r = String(user.role).toLowerCase();
    if (r === '2' || r === 'teacher') roleInt = 2;
    else if (r === '3' || r === 'student') roleInt = 3;
    else if (r === '4' || r === 'parent') roleInt = 4;

    this.http.get<string[]>(`${this.permsUrl}/roles/${roleInt}`).subscribe({
      next: (codes) => this.userPermissions.set(codes || []),
      error: () => {}
    });
  }

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(user => {
        localStorage.setItem('bt_auth_user', JSON.stringify(user));
        localStorage.setItem('bt_jwt_token', user.token);
        this.currentUser.set(user);
        this.loadUserPermissions();
      })
    );
  }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  getCurrentUserProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/me`);
  }

  changePassword(data: { oldPassword: string; newPassword: string }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/change-password`, data);
  }

  logout(): void {
    localStorage.removeItem('bt_auth_user');
    localStorage.removeItem('bt_jwt_token');
    this.currentUser.set(null);
    this.userPermissions.set([]);
  }

  getToken(): string | null {
    return localStorage.getItem('bt_jwt_token');
  }

  private getStoredUser(): LoginResponse | null {
    const data = localStorage.getItem('bt_auth_user');
    return data ? JSON.parse(data) : null;
  }
}
