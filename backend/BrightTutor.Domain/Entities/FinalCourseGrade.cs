using BrightTutor.Domain.Common;

namespace BrightTutor.Domain.Entities;

public class FinalCourseGrade : BaseEntity
{
    public Guid StudentId { get; set; }
    public Guid CourseId { get; set; }
    public Guid? ClassGroupId { get; set; }
    public Guid TeacherId { get; set; }

    // Category Averages
    public decimal HomeworkAverage { get; set; } = 0m;
    public decimal QuizAverage { get; set; } = 0m;
    public decimal TestAverage { get; set; } = 0m;
    public decimal FinalWeightedScore { get; set; } = 0m; // 0.0 - 100.0%

    public string LetterGrade { get; set; } = "A"; // "A+", "A", "B", "C", "D", "F"
    public string HonorsDistinction { get; set; } = "Pass"; // "High Distinction (Honors)", "Merit", "Pass", "Incomplete"
    public string? TeacherRemarks { get; set; }

    public bool IsFinalized { get; set; } = false;
    public DateTime? FinalizedAt { get; set; }
    public Guid? CertificateId { get; set; }

    public Student Student { get; set; } = null!;
    public Course Course { get; set; } = null!;
    public ClassGroup? ClassGroup { get; set; }
    public Teacher Teacher { get; set; } = null!;
}
