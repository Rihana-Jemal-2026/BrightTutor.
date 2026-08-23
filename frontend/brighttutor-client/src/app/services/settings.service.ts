import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SystemSettingDto {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt?: string;
}

export interface AcademicCalendarDto {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private apiUrl = 'http://localhost:5198/api/settings';

  constructor(private http: HttpClient) {}

  getSettings(): Observable<SystemSettingDto[]> {
    return this.http.get<SystemSettingDto[]>(this.apiUrl);
  }

  updateSetting(key: string, value: string): Observable<void> {
    return this.http.put<void>(this.apiUrl, { key, value });
  }

  getAcademicCalendars(isActive?: boolean): Observable<AcademicCalendarDto[]> {
    let url = `${this.apiUrl}/calendar`;
    if (isActive !== undefined && isActive !== null) url += `?isActive=${isActive}`;
    return this.http.get<AcademicCalendarDto[]>(url);
  }

  createAcademicCalendar(calendar: { title: string; startDate: string; endDate: string; isActive: boolean }): Observable<any> {
    return this.http.post(`${this.apiUrl}/calendar`, calendar);
  }
}
