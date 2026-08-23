using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Announcements.Queries.GetAnnouncementsList;

public class GetAnnouncementsListQuery : IRequest<List<AnnouncementDto>>
{
    public UserRole? TargetRole { get; set; }
}
