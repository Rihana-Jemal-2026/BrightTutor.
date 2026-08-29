export interface AnnouncementDto {
  id: string;
  title: string;
  content: string;
  targetRole?: number;
  createdByName: string;
  createdAt: string;
  isActive: boolean;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  targetRole?: number | null;
  createdByUserId?: string;
}
