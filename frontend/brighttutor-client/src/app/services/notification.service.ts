import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface NotificationDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: number | string;
  status: number | string;
  createdAt: string;
}

export interface AnnouncementDto {
  id: string;
  title: string;
  content: string;
  targetRole?: number | string;
  createdByName: string;
  createdAt: string;
}

export interface SendNotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5198/api';
  
  notifications = signal<NotificationDto[]>([]);
  unreadCount = signal<number>(0);

  loadNotifications(userId: string): Observable<NotificationDto[]> {
    return this.http.get<NotificationDto[]>(`${this.apiUrl}/notifications/user/${userId}`).pipe(
      tap(list => {
        this.notifications.set(list);
        const unread = list.filter(n => n.status === 1 || (n.status as any) === 'Unread' || (n.status as any) === '1').length;
        this.unreadCount.set(unread);
      })
    );
  }

  sendNotification(request: SendNotificationRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/notifications`, request);
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

  createAnnouncement(data: { title: string; content: string; targetRole?: number; createdByUserId?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/announcements`, data);
  }
}
