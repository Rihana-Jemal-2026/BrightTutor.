using BrightTutor.Domain.Enums;

namespace BrightTutor.Application.Teachers.Queries.GetTeachersList;

public class TeacherDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string TeacherCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Specialization { get; set; }
    public UserStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
