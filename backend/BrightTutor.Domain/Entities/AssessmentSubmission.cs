using BrightTutor.Domain.Common;

namespace BrightTutor.Domain.Entities;

public enum SubmissionStatus
{
    Submitted = 1,
    Graded = 2,
    Late = 3,
    ResubmissionRequested = 4
}

public class AssessmentSubmission : BaseEntity
{
    public Guid AssessmentId { get; set; }
    public Guid StudentId { get; set; }

    public string? SubmissionText { get; set; }
    public string? AttachmentUrl { get; set; } // PDF, image, or zip file

    // JSON map of selected question answers for online tests: { "1": 0, "2": 2 }
    public string? AnswersJson { get; set; }

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    // Grading & Remarks
    public decimal? Score { get; set; }
    public string? LetterGrade { get; set; } // "A+", "A", "B", "C", "F"
    public string? Feedback { get; set; }
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;

    public DateTime? GradedAt { get; set; }
    public Guid? GradedByTeacherId { get; set; }

    public Assessment Assessment { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Teacher? GradedByTeacher { get; set; }
}
