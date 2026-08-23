import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PermissionDto {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private apiUrl = 'http://localhost:5198/api/permissions';

  constructor(private http: HttpClient) {}

  getPermissions(): Observable<PermissionDto[]> {
    return this.http.get<PermissionDto[]>(this.apiUrl);
  }

  getRolePermissions(role: number): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/roles/${role}`);
  }

  assignPermissionsToRole(role: number, permissionCodes: string[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/roles/${role}`, permissionCodes);
  }
}
