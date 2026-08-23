import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: number;
  status: number;
  createdAt: string;
}

export interface AnnouncementDto {
  id: string;
  title: string;
  content: string;
  targetRole?: number;
  createdByName: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:5198/api';
  
  notifications = signal<NotificationDto[]>([]);
  unreadCount = signal<number>(0);

  constructor(private http: HttpClient) {}

  loadNotifications(userId: string): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(`${this.apiUrl}/notifications?userId=${userId}`).pipe(
      tap(list => {
        this.notifications.set(list);
        this.unreadCount.set(list.filter(n => n.status === 1).length); // Status 1 = Unread
      })
    );
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/notifications/${notificationId}/read`, {}).pipe(
      tap(() => {
        this.notifications.update(list =>
          list.map(n => n.id === notificationId ? { ...n, status: 2 } : n)
        );
        this.unreadCount.update(c => Math.max(0, c - 1));
      })
    );
  }

  getAnnouncements(): Observable<AnnouncementDto[]> {
    return this.http.get<AnnouncementDto[]>(`${this.apiUrl}/announcements`);
  }

  createAnnouncement(data: { title: string; content: string; targetRole?: number; createdByUserId: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/announcements`, data);
  }
}
