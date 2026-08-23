using MediatR;

namespace BrightTutor.Application.ClassGroups.Queries.GetClassGroupsList;

public class GetClassGroupsListQuery : IRequest<List<ClassGroupDto>>
{
    public Guid? CourseId { get; set; }
}
