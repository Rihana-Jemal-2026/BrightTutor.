using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AssessmentsController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public AssessmentsController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAssessments(
        [FromQuery] Guid? courseId,
        [FromQuery] Guid? classGroupId,
        [FromQuery] int? type,
        [FromQuery] Guid? studentId)
    {
        var query = _context.Assessments
            .Include(a => a.Course)
            .Include(a => a.ClassGroup)
            .Include(a => a.Teacher)
                .ThenInclude(t => t.User)
            .AsQueryable();

        if (courseId.HasValue && courseId.Value != Guid.Empty)
            query = query.Where(a => a.CourseId == courseId.Value);

        if (classGroupId.HasValue && classGroupId.Value != Guid.Empty)
            query = query.Where(a => a.ClassGroupId == classGroupId.Value || a.ClassGroupId == null);

        if (type.HasValue)
            query = query.Where(a => (int)a.Type == type.Value);

        var list = await query
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        var result = new List<object>();

        foreach (var a in list)
        {
            AssessmentSubmission? studentSubmission = null;
            if (studentId.HasValue && studentId.Value != Guid.Empty)
            {
                studentSubmission = await _context.AssessmentSubmissions
                    .FirstOrDefaultAsync(s => s.AssessmentId == a.Id && s.StudentId == studentId.Value);
            }

            var submissionsCount = await _context.AssessmentSubmissions.CountAsync(s => s.AssessmentId == a.Id);
            var gradedCount = await _context.AssessmentSubmissions.CountAsync(s => s.AssessmentId == a.Id && s.Status == SubmissionStatus.Graded);

            result.Add(new
            {
                id = a.Id,
                courseId = a.CourseId,
                courseName = a.Course?.Name ?? "General Course",
                classGroupId = a.ClassGroupId,
                classGroupName = a.ClassGroup?.Name,
                teacherId = a.TeacherId,
                teacherName = a.Teacher?.User != null ? $"{a.Teacher.User.FirstName} {a.Teacher.User.LastName}" : "Assigned Tutor",
                title = a.Title,
                description = a.Description,
                type = (int)a.Type,
                typeName = a.Type.ToString(),
                maxScore = a.MaxScore,
                weightPercentage = a.WeightPercentage,
                durationMinutes = a.DurationMinutes,
                dueDate = a.DueDate?.ToString("o"),
                hasQuestions = !string.IsNullOrEmpty(a.QuestionsJson),
                questionsJson = a.QuestionsJson,
                attachmentUrl = a.AttachmentUrl,
                isPublished = a.IsPublished,
                createdAt = a.CreatedAt.ToString("o"),
                submissionsCount,
                gradedCount,
                studentSubmission = studentSubmission != null ? new
                {
                    id = studentSubmission.Id,
                    submissionText = studentSubmission.SubmissionText,
                    attachmentUrl = studentSubmission.AttachmentUrl,
                    submittedAt = studentSubmission.SubmittedAt.ToString("g"),
                    score = studentSubmission.Score,
                    letterGrade = studentSubmission.LetterGrade,
                    feedback = studentSubmission.Feedback,
                    status = (int)studentSubmission.Status,
                    statusName = studentSubmission.Status.ToString(),
                    gradedAt = studentSubmission.GradedAt?.ToString("g")
                } : null
            });
        }

        return Ok(result);
    }

    public class CreateAssessmentDto
    {
        public Guid CourseId { get; set; }
        public Guid? ClassGroupId { get; set; }
        public Guid TeacherId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int Type { get; set; } = 1; // 1=Homework, 2=Quiz, 3=Test, 4=Exam, 5=Project
        public decimal MaxScore { get; set; } = 100m;
        public decimal WeightPercentage { get; set; } = 25m;
        public int DurationMinutes { get; set; } = 15;
        public DateTime? DueDate { get; set; }
        public string? QuestionsJson { get; set; }
        public string? AttachmentUrl { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> CreateAssessment([FromBody] CreateAssessmentDto dto)
    {
        var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == dto.TeacherId || t.UserId == dto.TeacherId)
            ?? await _context.Teachers.FirstOrDefaultAsync();

        if (teacher == null) return BadRequest(new { message = "No teacher record found." });

        var assessment = new Assessment
        {
            CourseId = dto.CourseId,
            ClassGroupId = dto.ClassGroupId,
            TeacherId = teacher.Id,
            Title = dto.Title,
            Description = dto.Description,
            Type = (AssessmentType)dto.Type,
            MaxScore = dto.MaxScore,
            WeightPercentage = dto.WeightPercentage,
            DurationMinutes = dto.DurationMinutes > 0 ? dto.DurationMinutes : 15,
            DueDate = dto.DueDate ?? DateTime.UtcNow.AddDays(7),
            QuestionsJson = dto.QuestionsJson,
            AttachmentUrl = dto.AttachmentUrl,
            IsPublished = true
        };

        _context.Assessments.Add(assessment);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"{assessment.Type} '{assessment.Title}' created successfully!",
            id = assessment.Id
        });
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateAssessment(Guid id, [FromBody] CreateAssessmentDto dto)
    {
        var assessment = await _context.Assessments.FindAsync(id);
        if (assessment == null) return NotFound(new { message = "Assessment not found." });

        assessment.Title = dto.Title;
        assessment.Description = dto.Description;
        assessment.Type = (AssessmentType)dto.Type;
        assessment.MaxScore = dto.MaxScore;
        assessment.WeightPercentage = dto.WeightPercentage;
        assessment.DurationMinutes = dto.DurationMinutes > 0 ? dto.DurationMinutes : 15;
        if (dto.DueDate.HasValue) assessment.DueDate = dto.DueDate.Value;
        if (dto.QuestionsJson != null) assessment.QuestionsJson = dto.QuestionsJson;
        if (dto.AttachmentUrl != null) assessment.AttachmentUrl = dto.AttachmentUrl;
        assessment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Assessment '{assessment.Title}' updated successfully!",
            id = assessment.Id
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAssessmentDetails(Guid id)
    {
        var assessment = await _context.Assessments
            .Include(a => a.Course)
            .Include(a => a.ClassGroup)
            .Include(a => a.Teacher)
                .ThenInclude(t => t.User)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assessment == null) return NotFound(new { message = "Assessment not found." });

        var submissions = await _context.AssessmentSubmissions
            .Include(s => s.Student)
                .ThenInclude(st => st.User)
            .Where(s => s.AssessmentId == id)
            .OrderByDescending(s => s.SubmittedAt)
            .Select(s => new
            {
                id = s.Id,
                studentId = s.StudentId,
                studentName = s.Student.User != null ? $"{s.Student.User.FirstName} {s.Student.User.LastName}" : "Student",
                studentCode = s.Student.StudentCode,
                submissionText = s.SubmissionText,
                attachmentUrl = s.AttachmentUrl,
                answersJson = s.AnswersJson,
                submittedAt = s.SubmittedAt.ToString("g"),
                score = s.Score,
                letterGrade = s.LetterGrade,
                feedback = s.Feedback,
                status = (int)s.Status,
                statusName = s.Status.ToString(),
                gradedAt = s.GradedAt.HasValue ? s.GradedAt.Value.ToString("g") : null
            })
            .ToListAsync();

        return Ok(new
        {
            id = assessment.Id,
            courseId = assessment.CourseId,
            courseName = assessment.Course?.Name,
            classGroupId = assessment.ClassGroupId,
            classGroupName = assessment.ClassGroup?.Name,
            teacherName = assessment.Teacher?.User != null ? $"{assessment.Teacher.User.FirstName} {assessment.Teacher.User.LastName}" : "Tutor",
            title = assessment.Title,
            description = assessment.Description,
            type = (int)assessment.Type,
            typeName = assessment.Type.ToString(),
            maxScore = assessment.MaxScore,
            weightPercentage = assessment.WeightPercentage,
            durationMinutes = assessment.DurationMinutes,
            dueDate = assessment.DueDate?.ToString("o"),
            questionsJson = assessment.QuestionsJson,
            attachmentUrl = assessment.AttachmentUrl,
            submissions
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAssessment(Guid id)
    {
        var assessment = await _context.Assessments.FindAsync(id);
        if (assessment == null) return NotFound(new { message = "Assessment not found." });

        var submissions = await _context.AssessmentSubmissions.Where(s => s.AssessmentId == id).ToListAsync();
        _context.AssessmentSubmissions.RemoveRange(submissions);
        _context.Assessments.Remove(assessment);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Assessment deleted successfully!" });
    }

    [HttpDelete("clear-all")]
    public async Task<IActionResult> ClearAllAssessments()
    {
        var submissions = await _context.AssessmentSubmissions.ToListAsync();
        var assessments = await _context.Assessments.ToListAsync();
        _context.AssessmentSubmissions.RemoveRange(submissions);
        _context.Assessments.RemoveRange(assessments);
        await _context.SaveChangesAsync();

        return Ok(new { message = "All test assessments cleared successfully!" });
    }

    public class SubmitAssessmentDto
    {
        public Guid StudentId { get; set; }
        public string? SubmissionText { get; set; }
        public string? AttachmentUrl { get; set; }
        public string? AnswersJson { get; set; }
    }

    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> SubmitAssessment(Guid id, [FromBody] SubmitAssessmentDto dto)
    {
        var assessment = await _context.Assessments.FindAsync(id);
        if (assessment == null) return NotFound(new { message = "Assessment not found." });

        var student = await _context.Students.Include(s => s.User).FirstOrDefaultAsync(s => s.Id == dto.StudentId || s.UserId == dto.StudentId);
        if (student == null) return NotFound(new { message = "Student not found." });

        var submission = await _context.AssessmentSubmissions
            .FirstOrDefaultAsync(s => s.AssessmentId == id && s.StudentId == student.Id);

        var isNew = submission == null;
        if (isNew)
        {
            submission = new AssessmentSubmission
            {
                AssessmentId = id,
                StudentId = student.Id
            };
            _context.AssessmentSubmissions.Add(submission);
        }

        submission.SubmissionText = dto.SubmissionText;
        submission.AttachmentUrl = dto.AttachmentUrl;
        submission.AnswersJson = dto.AnswersJson;
        submission.SubmittedAt = DateTime.UtcNow;
        submission.Status = SubmissionStatus.Submitted;

        // Auto-grade interactive online quiz/test if QuestionsJson is present
        if (!string.IsNullOrEmpty(assessment.QuestionsJson) && !string.IsNullOrEmpty(dto.AnswersJson))
        {
            try
            {
                var questions = JsonSerializer.Deserialize<List<QuizQuestionModel>>(assessment.QuestionsJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                var answers = JsonSerializer.Deserialize<Dictionary<string, int>>(dto.AnswersJson);

                if (questions != null && answers != null && questions.Count > 0)
                {
                    decimal totalEarned = 0;
                    decimal totalPossible = 0;

                    foreach (var q in questions)
                    {
                        var pts = q.Points > 0 ? q.Points : 10;
                        totalPossible += pts;

                        var key = q.Id.ToString();
                        if (answers.TryGetValue(key, out var selected) && selected == q.CorrectOption)
                        {
                            totalEarned += pts;
                        }
                    }

                    var percent = totalPossible > 0 ? (totalEarned / totalPossible) * assessment.MaxScore : 0;
                    submission.Score = Math.Round(percent, 1);
                    submission.Status = SubmissionStatus.Graded;
                    submission.GradedAt = DateTime.UtcNow;
                    submission.LetterGrade = CalculateLetterGrade(submission.Score.Value, assessment.MaxScore);
                    submission.Feedback = $"Automated Test Evaluation: Scored {submission.Score:F1}/{assessment.MaxScore} ({submission.LetterGrade})";
                }
            }
            catch { }
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = submission.Status == SubmissionStatus.Graded
                ? $"Test completed! Auto-graded score: {submission.Score} ({submission.LetterGrade})"
                : "Assignment submitted successfully! Your tutor will grade and review your submission.",
            submissionId = submission.Id,
            score = submission.Score,
            letterGrade = submission.LetterGrade
        });
    }

    public class GradeSubmissionDto
    {
        public decimal Score { get; set; }
        public string? LetterGrade { get; set; }
        public string? Feedback { get; set; }
        public Guid? TeacherId { get; set; }
    }

    [HttpPost("submissions/{submissionId:guid}/grade")]
    public async Task<IActionResult> GradeSubmission(Guid submissionId, [FromBody] GradeSubmissionDto dto)
    {
        var submission = await _context.AssessmentSubmissions
            .Include(s => s.Assessment)
            .Include(s => s.Student)
                .ThenInclude(st => st.User)
            .FirstOrDefaultAsync(s => s.Id == submissionId);

        if (submission == null) return NotFound(new { message = "Submission not found." });

        submission.Score = dto.Score;
        submission.LetterGrade = !string.IsNullOrEmpty(dto.LetterGrade)
            ? dto.LetterGrade
            : CalculateLetterGrade(dto.Score, submission.Assessment?.MaxScore ?? 100);

        submission.Feedback = dto.Feedback;
        submission.Status = SubmissionStatus.Graded;
        submission.GradedAt = DateTime.UtcNow;
        submission.GradedByTeacherId = dto.TeacherId;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Graded successfully! Score: {submission.Score} ({submission.LetterGrade}) for {submission.Student?.User?.FirstName}",
            score = submission.Score,
            letterGrade = submission.LetterGrade
        });
    }

    [HttpGet("course/{courseId:guid}/master-gradebook")]
    public async Task<IActionResult> GetMasterGradebook(Guid courseId, [FromQuery] Guid? classGroupId)
    {
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null) return NotFound(new { message = "Course not found." });

        // 1. Get all assessments for this course
        var assessmentsQuery = _context.Assessments.Where(a => a.CourseId == courseId);
        if (classGroupId.HasValue && classGroupId.Value != Guid.Empty)
            assessmentsQuery = assessmentsQuery.Where(a => a.ClassGroupId == classGroupId.Value || a.ClassGroupId == null);

        var assessments = await assessmentsQuery.OrderBy(a => a.Type).ThenBy(a => a.CreatedAt).ToListAsync();

        // 2. Get all enrolled students for this course
        var enrollmentsQuery = _context.Enrollments
            .Include(e => e.Student)
                .ThenInclude(s => s.User)
            .Where(e => e.CourseId == courseId && e.IsActive);

        if (classGroupId.HasValue && classGroupId.Value != Guid.Empty)
            enrollmentsQuery = enrollmentsQuery.Where(e => e.ClassGroupId == classGroupId.Value);

        var enrollments = await enrollmentsQuery.ToListAsync();

        // 3. Build student gradebook matrix
        var studentRows = new List<object>();

        foreach (var en in enrollments)
        {
            var student = en.Student;
            if (student == null) continue;

            var submissions = await _context.AssessmentSubmissions
                .Where(s => s.StudentId == student.Id && assessments.Select(a => a.Id).Contains(s.AssessmentId))
                .ToListAsync();

            var hwSubmissions = submissions.Where(s => assessments.Any(a => a.Id == s.AssessmentId && a.Type == AssessmentType.Homework && s.Score.HasValue)).ToList();
            var quizSubmissions = submissions.Where(s => assessments.Any(a => a.Id == s.AssessmentId && a.Type == AssessmentType.Quiz && s.Score.HasValue)).ToList();
            var testSubmissions = submissions.Where(s => assessments.Any(a => a.Id == s.AssessmentId && (a.Type == AssessmentType.Test || a.Type == AssessmentType.Exam) && s.Score.HasValue)).ToList();

            decimal hwAvg = hwSubmissions.Count > 0 ? hwSubmissions.Average(s => s.Score!.Value) : 0;
            decimal quizAvg = quizSubmissions.Count > 0 ? quizSubmissions.Average(s => s.Score!.Value) : 0;
            decimal testAvg = testSubmissions.Count > 0 ? testSubmissions.Average(s => s.Score!.Value) : 0;

            // Default weight: 30% Homework, 30% Quizzes, 40% Tests
            // If some categories have no items, weight equally among available
            decimal weightedScore = 0;
            int countActiveCats = 0;
            if (hwSubmissions.Count > 0) { weightedScore += (hwAvg * 0.30m); countActiveCats++; }
            if (quizSubmissions.Count > 0) { weightedScore += (quizAvg * 0.30m); countActiveCats++; }
            if (testSubmissions.Count > 0) { weightedScore += (testAvg * 0.40m); countActiveCats++; }

            if (countActiveCats == 0 && submissions.Any(s => s.Score.HasValue))
            {
                weightedScore = submissions.Where(s => s.Score.HasValue).Average(s => s.Score!.Value);
            }
            else if (countActiveCats > 0 && countActiveCats < 3)
            {
                // Normalize to 100%
                decimal divisor = (hwSubmissions.Count > 0 ? 0.30m : 0) + (quizSubmissions.Count > 0 ? 0.30m : 0) + (testSubmissions.Count > 0 ? 0.40m : 0);
                if (divisor > 0) weightedScore = weightedScore / divisor;
            }

            weightedScore = Math.Round(weightedScore, 1);
            var letterGrade = CalculateLetterGrade(weightedScore, 100);
            var honors = weightedScore >= 90 ? "High Distinction (Honors)" : weightedScore >= 75 ? "Merit" : weightedScore >= 60 ? "Pass" : "Requires Retest";

            // Check if final grade is already recorded
            var finalized = await _context.FinalCourseGrades
                .FirstOrDefaultAsync(f => f.StudentId == student.Id && f.CourseId == courseId);

            var assessmentScores = assessments.Select(a =>
            {
                var sub = submissions.FirstOrDefault(s => s.AssessmentId == a.Id);
                return new
                {
                    assessmentId = a.Id,
                    title = a.Title,
                    type = (int)a.Type,
                    maxScore = a.MaxScore,
                    score = sub?.Score,
                    letterGrade = sub?.LetterGrade,
                    status = sub != null ? sub.Status.ToString() : "NotSubmitted"
                };
            }).ToList();

            studentRows.Add(new
            {
                studentId = student.Id,
                studentCode = student.StudentCode,
                studentName = student.User != null ? $"{student.User.FirstName} {student.User.LastName}" : "Student",
                profilePhotoUrl = student.ProfilePhotoUrl,
                hwAverage = Math.Round(hwAvg, 1),
                quizAverage = Math.Round(quizAvg, 1),
                testAverage = Math.Round(testAvg, 1),
                cumulativeScore = weightedScore,
                suggestedLetterGrade = letterGrade,
                honorsDistinction = honors,
                assessmentScores,
                isFinalized = finalized?.IsFinalized ?? false,
                finalGrade = finalized != null ? new
                {
                    finalScore = finalized.FinalWeightedScore,
                    letterGrade = finalized.LetterGrade,
                    honors = finalized.HonorsDistinction,
                    remarks = finalized.TeacherRemarks,
                    finalizedAt = finalized.FinalizedAt?.ToString("g"),
                    certificateId = finalized.CertificateId
                } : null
            });
        }

        return Ok(new
        {
            courseId = course.Id,
            courseName = course.Name,
            assessments = assessments.Select(a => new
            {
                id = a.Id,
                title = a.Title,
                type = (int)a.Type,
                typeName = a.Type.ToString(),
                maxScore = a.MaxScore,
                weightPercentage = a.WeightPercentage
            }),
            students = studentRows
        });
    }

    public class FinalizeGradeDto
    {
        public Guid StudentId { get; set; }
        public Guid CourseId { get; set; }
        public Guid? ClassGroupId { get; set; }
        public Guid TeacherId { get; set; }
        public decimal FinalScore { get; set; }
        public string LetterGrade { get; set; } = "A";
        public string HonorsDistinction { get; set; } = "Pass";
        public string? TeacherRemarks { get; set; }
    }

    [HttpPost("course/{courseId:guid}/finalize-grade")]
    public async Task<IActionResult> FinalizeCourseGrade(Guid courseId, [FromBody] FinalizeGradeDto dto)
    {
        var student = await _context.Students.Include(s => s.User).FirstOrDefaultAsync(s => s.Id == dto.StudentId);
        if (student == null) return NotFound(new { message = "Student not found." });

        var course = await _context.Courses.FindAsync(courseId);
        if (course == null) return NotFound(new { message = "Course not found." });

        var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == dto.TeacherId || t.UserId == dto.TeacherId)
            ?? await _context.Teachers.FirstOrDefaultAsync();

        var record = await _context.FinalCourseGrades
            .FirstOrDefaultAsync(f => f.StudentId == student.Id && f.CourseId == courseId);

        if (record == null)
        {
            record = new FinalCourseGrade
            {
                StudentId = student.Id,
                CourseId = courseId,
                ClassGroupId = dto.ClassGroupId,
                TeacherId = teacher?.Id ?? Guid.Empty
            };
            _context.FinalCourseGrades.Add(record);
        }

        record.FinalWeightedScore = dto.FinalScore;
        record.LetterGrade = dto.LetterGrade;
        record.HonorsDistinction = dto.HonorsDistinction;
        record.TeacherRemarks = dto.TeacherRemarks;
        record.IsFinalized = true;
        record.FinalizedAt = DateTime.UtcNow;

        // Auto-Issue Official Certificate of Completion
        var existingCert = await _context.Certificates.FirstOrDefaultAsync(c => c.StudentId == student.Id && c.CourseId == courseId);
        if (existingCert == null)
        {
            var cert = new Certificate
            {
                StudentId = student.Id,
                CourseId = courseId,
                TeacherId = teacher?.Id,
                Type = CertificateType.StudentCourseCompletion,
                SerialNumber = $"CERT-{DateTime.UtcNow.Year}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
                RecipientName = $"{student.User?.FirstName} {student.User?.LastName}",
                Title = $"Certificate of Academic Achievement - {course.Name}",
                Description = $"Awarded for completing {course.Name} with {dto.HonorsDistinction} ({dto.LetterGrade} - {dto.FinalScore:F1}%). Remark: {dto.TeacherRemarks ?? "Demonstrated mastery of course learning outcomes."}",
                SkillsLearned = $"{course.Name} Core Competencies, Applied Problem Solving & Assessments",
                TimelineDuration = "3 Months (12 Weeks)",
                IssueDate = DateTime.UtcNow,
                AttendancePercentage = 100m
            };
            _context.Certificates.Add(cert);
            await _context.SaveChangesAsync();
            record.CertificateId = cert.Id;
        }
        else
        {
            existingCert.Description = $"Awarded for completing {course.Name} with {dto.HonorsDistinction} ({dto.LetterGrade} - {dto.FinalScore:F1}%). Remark: {dto.TeacherRemarks ?? "Demonstrated mastery of course learning outcomes."}";
            record.CertificateId = existingCert.Id;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Final course grade finalized & Digital Certificate generated for {student.User?.FirstName} {student.User?.LastName}!",
            certificateId = record.CertificateId,
            finalScore = record.FinalWeightedScore,
            letterGrade = record.LetterGrade,
            honors = record.HonorsDistinction
        });
    }

    private static string CalculateLetterGrade(decimal score, decimal maxScore)
    {
        if (maxScore <= 0) maxScore = 100;
        var percent = (score / maxScore) * 100m;

        return percent switch
        {
            >= 95m => "A+",
            >= 90m => "A",
            >= 85m => "B+",
            >= 80m => "B",
            >= 75m => "C+",
            >= 70m => "C",
            >= 60m => "D",
            _ => "F"
        };
    }

    private class QuizQuestionModel
    {
        public int Id { get; set; }
        public string Question { get; set; } = string.Empty;
        public List<string> Options { get; set; } = new();
        public int CorrectOption { get; set; }
        public decimal Points { get; set; } = 10m;
    }
}
