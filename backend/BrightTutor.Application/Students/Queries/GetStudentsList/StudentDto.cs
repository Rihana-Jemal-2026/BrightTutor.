using BrightTutor.Domain.Enums;

namespace BrightTutor.Application.Students.Queries.GetStudentsList;

public class StudentDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string StudentCode { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? GradeLevel { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public UserStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
