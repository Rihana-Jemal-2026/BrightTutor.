using BrightTutor.Application.Users.Queries.GetUsersList;
using MediatR;

namespace BrightTutor.Application.Users.Queries.GetUserById;

public class GetUserByIdQuery : IRequest<UserDto?>
{
    public Guid UserId { get; set; }
}
