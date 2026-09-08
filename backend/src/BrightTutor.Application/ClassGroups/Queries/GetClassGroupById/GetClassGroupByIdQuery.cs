using BrightTutor.Application.ClassGroups.Queries.GetClassGroupsList;
using MediatR;

namespace BrightTutor.Application.ClassGroups.Queries.GetClassGroupById;

public class GetClassGroupByIdQuery : IRequest<ClassGroupDto?>
{
    public Guid ClassGroupId { get; set; }
}
