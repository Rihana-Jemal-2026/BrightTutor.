using AutoMapper;
using BrightTutor.Application.Announcements.Queries.GetAnnouncementsList;
using BrightTutor.Application.Notifications.Queries.GetUserNotifications;
using BrightTutor.Domain.Entities;

namespace BrightTutor.Application.Common.Mappings;

public class NotificationMappingProfile : Profile
{
    public NotificationMappingProfile()
    {
        CreateMap<Notification, NotificationDto>();
        CreateMap<Announcement, AnnouncementDto>()
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByUser != null ? $"{src.CreatedByUser.FirstName} {src.CreatedByUser.LastName}" : string.Empty));
    }
}
