using BrightTutor.Domain.Enums;
using MediatR;

namespace BrightTutor.Application.Users.Queries.GetUsersList;

public class GetUsersListQuery : IRequest<List<UserDto>>
{
    public UserRole? Role { get; set; }
    public UserStatus? Status { get; set; }
}
