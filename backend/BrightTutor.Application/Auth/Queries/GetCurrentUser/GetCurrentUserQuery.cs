using MediatR;

namespace BrightTutor.Application.Auth.Queries.GetCurrentUser;

public class GetCurrentUserQuery : IRequest<CurrentUserDto>
{
}
