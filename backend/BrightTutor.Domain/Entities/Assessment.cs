using BrightTutor.Domain.Common;

namespace BrightTutor.Domain.Entities;

public enum AssessmentType
{
    Homework = 1,
    Quiz = 2,
    Test = 3,
    Exam = 4,
    Project = 5
}

public class Assessment : BaseEntity
{
    public Guid CourseId { get; set; }
    public Guid? ClassGroupId { get; set; }
    public Guid TeacherId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public AssessmentType Type { get; set; } = AssessmentType.Homework;

    public decimal MaxScore { get; set; } = 100m;
    public decimal WeightPercentage { get; set; } = 25m; // E.g. 25% of final grade
    public int DurationMinutes { get; set; } = 15; // Customizable time limit in minutes for quizzes / tests
    public DateTime? DueDate { get; set; }

    // JSON array of questions for interactive quizzes / tests:
    // [{ "id": 1, "question": "...", "options": ["A", "B", "C", "D"], "correctOption": 0, "points": 10 }]
    public string? QuestionsJson { get; set; }

    public string? AttachmentUrl { get; set; }
    public bool IsPublished { get; set; } = true;

    public Course Course { get; set; } = null!;
    public ClassGroup? ClassGroup { get; set; }
    public Teacher Teacher { get; set; } = null!;
}
