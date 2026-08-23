import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: number;
  status: number;
  createdAt: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  role: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:5198/api/users';

  constructor(private http: HttpClient) {}

  getUsers(role?: number, status?: number): Observable<UserDto[]> {
    let url = this.apiUrl;
    const params: string[] = [];
    if (role !== undefined && role !== null) params.push(`role=${role}`);
    if (status !== undefined && status !== null) params.push(`status=${status}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    return this.http.get<UserDto[]>(url);
  }

  getUserById(id: string): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/${id}`);
  }

  createUser(user: CreateUserRequest): Observable<any> {
    return this.http.post(this.apiUrl, user);
  }

  updateUser(id: string, user: any): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, user);
  }

  updateUserStatus(id: string, status: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/status`, status);
  }
}
