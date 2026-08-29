using BrightTutor.Domain.Common;

namespace BrightTutor.Domain.Entities;

public enum CertificateType
{
    StudentCourseCompletion = 1,
    TeacherServiceExcellence = 2
}

public class Certificate : BaseEntity
{
    public string SerialNumber { get; set; } = string.Empty;
    public CertificateType Type { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string SkillsLearned { get; set; } = string.Empty;
    public string TimelineDuration { get; set; } = "3 Months (12 Weeks)";

    public Guid? StudentId { get; set; }
    public Guid? TeacherId { get; set; }
    public Guid? CourseId { get; set; }

    public DateTime IssueDate { get; set; } = DateTime.UtcNow;
    public decimal AttendancePercentage { get; set; } = 100.0m;
}
