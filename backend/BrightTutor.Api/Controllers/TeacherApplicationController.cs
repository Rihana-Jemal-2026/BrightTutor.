using BrightTutor.Application.Abstractions.Authentication;
using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using BrightTutor.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeacherApplicationController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public TeacherApplicationController(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public class ApplyTeacherDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Specialization { get; set; } = string.Empty;
        public int YearsOfExperience { get; set; }
        public string? CvDocumentUrl { get; set; }
        public string? BackgroundDocUrl { get; set; }
        public string? BioSummary { get; set; }
    }

    [HttpPost("apply")]
    [AllowAnonymous]
    public async Task<IActionResult> ApplyTeacher([FromBody] ApplyTeacherDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email) ||
            await _context.TeacherApplications.AnyAsync(a => a.Email == dto.Email && a.Status != TeacherApplicationStatus.Rejected))
        {
            return BadRequest(new { message = "An account or active application with this email already exists." });
        }

        var app = new TeacherApplication
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber,
            Specialization = dto.Specialization,
            YearsOfExperience = dto.YearsOfExperience,
            CvDocumentUrl = dto.CvDocumentUrl,
            BackgroundDocUrl = dto.BackgroundDocUrl,
            BioSummary = dto.BioSummary,
            Status = TeacherApplicationStatus.PendingScreening
        };

        _context.TeacherApplications.Add(app);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Teacher application submitted! Status: Pending Document Screening.", applicationId = app.Id });
    }

    [HttpGet("applications")]
    public async Task<IActionResult> GetApplications()
    {
        var list = await _context.TeacherApplications.OrderByDescending(a => a.CreatedAt).ToListAsync();
        return Ok(list);
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveTeacher(Guid id)
    {
        var app = await _context.TeacherApplications.FindAsync(id);
        if (app == null) return NotFound();

        // 1. Create User
        var tempPassword = "TeacherPass123!";
        var user = new User
        {
            FirstName = app.FirstName,
            LastName = app.LastName,
            Email = app.Email,
            PhoneNumber = app.PhoneNumber,
            Role = UserRole.Teacher,
            Status = UserStatus.Active,
            PasswordHash = _passwordHasher.HashPassword(tempPassword)
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // 2. Create Teacher Entity & Code
        var teacherCount = await _context.Teachers.CountAsync() + 1;
        var teacherCode = $"TCH-{teacherCount:D6}";

        var teacher = new Teacher
        {
            UserId = user.Id,
            TeacherCode = teacherCode,
            Specialization = app.Specialization
        };
        _context.Teachers.Add(teacher);

        // 3. Update Application Record
        app.Status = TeacherApplicationStatus.ApprovedAvailable;
        app.CreatedUserId = user.Id;

        // 4. Send Notification
        var notif = new Notification
        {
            UserId = user.Id,
            Title = "🎉 Application Approved & Account Created!",
            Message = $"Congratulations! Your teacher application has been approved. Your Teacher Code is {teacherCode}. Login email: {app.Email}, password: '{tempPassword}'. Please review and accept the Teacher SLA contract.",
            Type = NotificationType.GeneralAnnouncement,
            Status = NotificationStatus.Unread
        };
        _context.Notifications.Add(notif);

        await _context.SaveChangesAsync();

        return Ok(new { message = "Teacher application approved and account created successfully!", teacherCode, email = app.Email, tempPassword });
    }

    public class RejectAppDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectTeacher(Guid id, [FromBody] RejectAppDto dto)
    {
        var app = await _context.TeacherApplications.FindAsync(id);
        if (app == null) return NotFound();

        app.Status = TeacherApplicationStatus.Rejected;
        app.RejectionReason = dto.Reason;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Teacher application rejected with feedback reason provided." });
    }

    public class AcceptSlaDto
    {
        public Guid ApplicationId { get; set; }
    }

    [HttpPost("accept-sla")]
    public async Task<IActionResult> AcceptSla([FromBody] AcceptSlaDto dto)
    {
        var app = await _context.TeacherApplications.FindAsync(dto.ApplicationId);
        if (app == null) return NotFound();

        app.HasAcceptedContractSla = true;
        app.ContractAcceptedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "BrightTutor Teacher SLA Rules & Agreement successfully accepted! Ready for class assignments." });
    }

    public class AssignmentActionDto
    {
        public Guid AssignmentId { get; set; }
        public bool Accept { get; set; }
        public string? RejectionReason { get; set; }
    }

    [HttpPost("assignment-action")]
    public async Task<IActionResult> RespondToAssignment([FromBody] AssignmentActionDto dto)
    {
        var assignment = await _context.TeacherAssignments.FindAsync(dto.AssignmentId);
        if (assignment == null) return NotFound(new { message = "Teacher assignment record not found." });

        if (dto.Accept)
        {
            var notif = new Notification
            {
                UserId = assignment.TeacherId,
                Title = "✅ Class Assignment Accepted",
                Message = "You have accepted the class assignment. Schedules are live on your calendar.",
                Type = NotificationType.ScheduleAlert,
                Status = NotificationStatus.Unread
            };
            _context.Notifications.Add(notif);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Class assignment accepted successfully!" });
        }
        else
        {
            // Remove assignment so admin can reassign
            _context.TeacherAssignments.Remove(assignment);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Assignment rejected. Admin notified to assign an alternative teacher.", reason = dto.RejectionReason });
        }
    }
}
