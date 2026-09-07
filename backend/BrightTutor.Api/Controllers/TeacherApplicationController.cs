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
        var emailMatch = dto.Email.Trim().ToLower();

        if (await _context.TeacherApplications.AnyAsync(a => a.Email.ToLower() == emailMatch && a.Status != TeacherApplicationStatus.Rejected))
        {
            return BadRequest(new { message = "An active teacher application with this email already exists." });
        }

        // 1. Create User account immediately so teacher can log in to dashboard right away
        var tempPassword = "TeacherPass123!";
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == emailMatch);
        if (user == null)
        {
            user = new User
            {
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                Role = UserRole.Teacher,
                Status = UserStatus.Active,
                PasswordHash = _passwordHasher.HashPassword(tempPassword)
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }

        // 2. Create TeacherApplication record linked to CreatedUserId
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
            CreatedUserId = user.Id,
            Status = TeacherApplicationStatus.PendingScreening
        };

        _context.TeacherApplications.Add(app);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Teacher application submitted successfully! Default login password: 'TeacherPass123!'. You can log in to your Teacher Dashboard to track your screening status.",
            applicationId = app.Id,
            defaultPassword = tempPassword,
            status = "PendingScreening"
        });
    }

    [HttpGet("applications")]
    public async Task<IActionResult> GetApplications()
    {
        var list = await _context.TeacherApplications.OrderByDescending(a => a.CreatedAt).ToListAsync();
        return Ok(list);
    }

    [HttpGet("track/{emailOrId}")]
    [AllowAnonymous]
    public async Task<IActionResult> TrackTeacherApplication(string emailOrId)
    {
        TeacherApplication? app = null;
        if (Guid.TryParse(emailOrId, out var appId))
        {
            app = await _context.TeacherApplications.FindAsync(appId);
        }
        else
        {
            app = await _context.TeacherApplications
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefaultAsync(a => a.Email.ToLower() == emailOrId.ToLower());
        }

        if (app == null) return NotFound(new { message = "No application record found for provided email or application ID." });

        string? teacherCode = null;
        if (app.CreatedUserId.HasValue)
        {
            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == app.CreatedUserId.Value);
            teacherCode = teacher?.TeacherCode;
        }

        return Ok(new
        {
            applicationId = app.Id,
            fullName = $"{app.FirstName} {app.LastName}",
            email = app.Email,
            phoneNumber = app.PhoneNumber,
            specialization = app.Specialization,
            yearsOfExperience = app.YearsOfExperience,
            status = app.Status.ToString(),
            statusCode = (int)app.Status,
            rejectionReason = app.RejectionReason,
            teacherCode,
            hasAcceptedContractSla = app.HasAcceptedContractSla
        });
    }

    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveTeacher(Guid id)
    {
        var app = await _context.TeacherApplications.FindAsync(id);
        if (app == null) return NotFound();

        // 1. Get or Create User
        var tempPassword = "TeacherPass123!";
        User? user = null;
        if (app.CreatedUserId.HasValue)
        {
            user = await _context.Users.FindAsync(app.CreatedUserId.Value);
        }
        if (user == null)
        {
            user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == app.Email.ToLower());
        }
        if (user == null)
        {
            user = new User
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
        }

        // 2. Create Teacher Entity & Code
        var existingTeacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == user.Id);
        string teacherCode = existingTeacher?.TeacherCode ?? "";

        if (existingTeacher == null)
        {
            var teacherCount = await _context.Teachers.CountAsync() + 1;
            teacherCode = $"TCH-{teacherCount:D6}";

            var teacher = new Teacher
            {
                UserId = user.Id,
                TeacherCode = teacherCode,
                Specialization = app.Specialization
            };
            _context.Teachers.Add(teacher);
        }

        // 3. Update Application Record
        app.Status = TeacherApplicationStatus.ApprovedAvailable;
        app.CreatedUserId = user.Id;

        // 4. Send Notification
        var notif = new Notification
        {
            UserId = user.Id,
            Title = "Application Approved & Account Active!",
            Message = $"Congratulations! Your teacher application has been approved. Your Teacher Code is {teacherCode}. Please review and accept the Teacher SLA contract.",
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

        var reasonText = string.IsNullOrWhiteSpace(dto?.Reason) ? "Qualifications or documents incomplete" : dto.Reason;
        app.Status = TeacherApplicationStatus.Rejected;
        app.RejectionReason = reasonText;

        if (app.CreatedUserId.HasValue)
        {
            var notif = new Notification
            {
                UserId = app.CreatedUserId.Value,
                Title = "Teacher Application Status Update",
                Message = $"Your application for teaching position has been reviewed. Decision: Application Rejected. Reason: {reasonText}",
                Type = NotificationType.GeneralAnnouncement,
                Status = NotificationStatus.Unread
            };
            _context.Notifications.Add(notif);
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Teacher application rejected with feedback reason provided.", rejectionReason = reasonText });
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
