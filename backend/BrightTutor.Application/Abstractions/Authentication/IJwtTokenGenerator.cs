using BrightTutor.Domain.Entities;

namespace BrightTutor.Application.Abstractions.Authentication;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}
