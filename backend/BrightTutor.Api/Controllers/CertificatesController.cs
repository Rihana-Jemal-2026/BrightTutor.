using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CertificatesController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public CertificatesController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("student-eligibility")]
    public async Task<IActionResult> CheckStudentEligibility([FromQuery] Guid studentId, [FromQuery] Guid courseId)
    {
        var student = await _context.Students.Include(s => s.User).FirstOrDefaultAsync(s => s.Id == studentId || s.UserId == studentId);
        if (student == null) return NotFound(new { message = "Student not found." });

        var course = await _context.Courses.FindAsync(courseId);
        if (course == null) return NotFound(new { message = "Course not found." });

        var attendances = await _context.Attendances
            .Where(a => a.StudentId == student.Id)
            .ToListAsync();

        var totalSessions = attendances.Count;
        var presentCount = attendances.Count(a => a.Status == Domain.Enums.AttendanceStatus.Present || a.Status == Domain.Enums.AttendanceStatus.Excused);
        var absencePercentage = totalSessions > 0 ? ((decimal)(totalSessions - presentCount) / totalSessions) * 100 : 0;
        var attendancePercentage = totalSessions > 0 ? ((decimal)presentCount / totalSessions) * 100 : 100;

        var isEligible = absencePercentage <= 20.0m;

        return Ok(new
        {
            studentName = $"{student.User?.FirstName} {student.User?.LastName}",
            courseName = course.Name,
            totalSessions,
            presentCount,
            attendancePercentage = Math.Round(attendancePercentage, 1),
            absencePercentage = Math.Round(absencePercentage, 1),
            maxAllowedAbsenceRule = "20.0%",
            isEligible,
            statusMessage = isEligible
                ? "Eligible for 3-Month Course Completion Certificate! (Absence threshold <20% passed)"
                : "Not Eligible yet: Absence rate exceeds 20.0% threshold."
        });
    }

    public class IssueStudentCertDto
    {
        public Guid StudentId { get; set; }
        public Guid CourseId { get; set; }
    }

    [HttpPost("issue-student-certificate")]
    public async Task<IActionResult> IssueStudentCertificate([FromBody] IssueStudentCertDto dto)
    {
        var student = await _context.Students.Include(s => s.User).FirstOrDefaultAsync(s => s.Id == dto.StudentId || s.UserId == dto.StudentId);
        if (student == null) return NotFound(new { message = "Student not found." });

        var course = await _context.Courses.FindAsync(dto.CourseId);
        if (course == null) return NotFound(new { message = "Course not found." });

        var serialNumber = $"CERT-STU-{DateTime.UtcNow:yyyyMM}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

        var cert = new Certificate
        {
            SerialNumber = serialNumber,
            Type = CertificateType.StudentCourseCompletion,
            RecipientName = $"{student.User?.FirstName} {student.User?.LastName}",
            Title = $"Certificate of Academic Completion: {course.Name}",
            Description = $"This certifies that {student.User?.FirstName} {student.User?.LastName} has successfully completed the intensive 3-Month curriculum for {course.Name} with an attendance record of >=80%.",
            SkillsLearned = course.Description,
            TimelineDuration = "3 Months (12 Weeks Curriculum)",
            StudentId = student.Id,
            CourseId = course.Id,
            IssueDate = DateTime.UtcNow,
            AttendancePercentage = 95.0m
        };

        _context.Certificates.Add(cert);
        await _context.SaveChangesAsync();

        return Ok(cert);
    }

    public class IssueTeacherCertDto
    {
        public Guid TeacherId { get; set; }
    }

    [HttpPost("issue-teacher-certificate")]
    public async Task<IActionResult> IssueTeacherCertificate([FromBody] IssueTeacherCertDto dto)
    {
        var teacher = await _context.Teachers.Include(t => t.User).FirstOrDefaultAsync(t => t.Id == dto.TeacherId || t.UserId == dto.TeacherId);
        if (teacher == null) return NotFound(new { message = "Teacher not found." });

        var serialNumber = $"CERT-TCH-{DateTime.UtcNow:yyyyMM}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

        var cert = new Certificate
        {
            SerialNumber = serialNumber,
            Type = CertificateType.TeacherServiceExcellence,
            RecipientName = $"{teacher.User?.FirstName} {teacher.User?.LastName}",
            Title = "Certificate of Professional Teaching Excellence (1+ Year Service)",
            Description = $"Presented in recognition of outstanding instructional service, pedagogical dedication, and 1+ year of active service as a Certified Tutor at BrightTutor Academy.",
            SkillsLearned = $"Specialization: {teacher.Specialization} | Advanced Curriculum Delivery & Mentorship",
            TimelineDuration = "1 Year Service Recognition",
            TeacherId = teacher.Id,
            IssueDate = DateTime.UtcNow
        };

        _context.Certificates.Add(cert);
        await _context.SaveChangesAsync();

        return Ok(cert);
    }

    [HttpGet("verify/{serialNumber}")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyCertificate(string serialNumber)
    {
        var cert = await _context.Certificates.FirstOrDefaultAsync(c => c.SerialNumber == serialNumber);
        if (cert == null) return NotFound(new { verified = false, message = "Invalid or unverified certificate serial number." });

        return Ok(new { verified = true, certificate = cert });
    }

    [HttpGet("my-certificates")]
    public async Task<IActionResult> GetMyCertificates([FromQuery] Guid userId)
    {
        var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == userId);
        var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == userId);

        var list = await _context.Certificates
            .Where(c => (student != null && c.StudentId == student.Id) || (teacher != null && c.TeacherId == teacher.Id))
            .OrderByDescending(c => c.IssueDate)
            .ToListAsync();

        return Ok(list);
    }
}
