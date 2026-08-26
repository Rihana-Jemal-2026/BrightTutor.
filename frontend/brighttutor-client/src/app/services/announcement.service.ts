import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnnouncementDto, CreateAnnouncementRequest } from '../models/announcement.model';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5198/api/announcements';

  getAnnouncements(targetRole?: number): Observable<AnnouncementDto[]> {
    let params = new HttpParams();
    if (targetRole !== undefined && targetRole !== null) {
      params = params.set('targetRole', targetRole.toString());
    }
    return this.http.get<AnnouncementDto[]>(this.apiUrl, { params });
  }

  createAnnouncement(request: CreateAnnouncementRequest): Observable<AnnouncementDto> {
    return this.http.post<AnnouncementDto>(this.apiUrl, request);
  }
}
