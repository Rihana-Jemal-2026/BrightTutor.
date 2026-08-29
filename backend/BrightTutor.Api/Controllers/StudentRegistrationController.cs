using BrightTutor.Application.Abstractions.Authentication;
using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudentRegistrationController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public StudentRegistrationController(IApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public class SubmitRegistrationDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string GradeLevel { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public decimal? GpsLatitude { get; set; }
        public decimal? GpsLongitude { get; set; }
        public ServiceType DesiredServiceType { get; set; }
        public Guid CourseId { get; set; }
    }

    [HttpPost("submit")]
    [AllowAnonymous]
    public async Task<IActionResult> SubmitRegistration([FromBody] SubmitRegistrationDto dto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == dto.Email) ||
            await _context.StudentRegistrations.AnyAsync(r => r.Email == dto.Email && r.Status != RegistrationStatus.Rejected))
        {
            return BadRequest(new { message = "An account or pending registration with this email already exists." });
        }

        var registration = new StudentRegistration
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            PhoneNumber = dto.PhoneNumber,
            GradeLevel = dto.GradeLevel,
            Address = dto.Address,
            GpsLatitude = dto.GpsLatitude,
            GpsLongitude = dto.GpsLongitude,
            DesiredServiceType = dto.DesiredServiceType,
            CourseId = dto.CourseId,
            Status = RegistrationStatus.PendingApproval
        };

        _context.StudentRegistrations.Add(registration);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Your registration has been submitted successfully! Status: Pending Admin Approval.",
            registrationId = registration.Id
        });
    }

    public class UploadReceiptDto
    {
        public Guid RegistrationId { get; set; }
        public string PaymentChannel { get; set; } = "CBE Birr";
        public string TransactionId { get; set; } = string.Empty;
        public decimal AmountPaid { get; set; }
        public string ReceiptImageBase64 { get; set; } = string.Empty;
    }

    [HttpPost("upload-receipt")]
    [AllowAnonymous]
    public async Task<IActionResult> UploadReceipt([FromBody] UploadReceiptDto dto)
    {
        var reg = await _context.StudentRegistrations.FindAsync(dto.RegistrationId);
        if (reg == null) return NotFound(new { message = "Registration record not found." });

        reg.PaymentChannel = dto.PaymentChannel;
        reg.TransactionId = dto.TransactionId;
        reg.AmountPaid = dto.AmountPaid;
        reg.ReceiptImageBase64 = dto.ReceiptImageBase64;
        reg.PaymentSubmittedAt = DateTime.UtcNow;
        reg.Status = RegistrationStatus.PaymentSubmitted;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Payment receipt slip submitted! Status: Pending Admin Verification (1-3 business hours)." });
    }

    [HttpGet("pending-approvals")]
    public async Task<IActionResult> GetPendingApprovals()
    {
        var list = await _context.StudentRegistrations
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();
        return Ok(list);
    }

    [HttpPost("{id}/approve-registration")]
    public async Task<IActionResult> ApproveRegistration(Guid id)
    {
        var reg = await _context.StudentRegistrations.FindAsync(id);
        if (reg == null) return NotFound();

        reg.Status = RegistrationStatus.ApprovedPendingPayment;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Student registration approved. Student notified to submit payment slip." });
    }

    [HttpPost("{id}/verify-payment")]
    public async Task<IActionResult> VerifyPayment(Guid id)
    {
        var reg = await _context.StudentRegistrations.FindAsync(id);
        if (reg == null) return NotFound();

        // 1. Create User
        var tempPassword = "StudentPass123!";
        var user = new User
        {
            FirstName = reg.FirstName,
            LastName = reg.LastName,
            Email = reg.Email,
            PhoneNumber = reg.PhoneNumber,
            Role = UserRole.Student,
            Status = UserStatus.Active,
            PasswordHash = _passwordHasher.HashPassword(tempPassword)
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // 2. Create Student Entity & ID
        var studentCount = await _context.Students.CountAsync() + 1;
        var studentCode = $"STU-{studentCount:D6}";

        var student = new Student
        {
            UserId = user.Id,
            StudentCode = studentCode,
            GradeLevel = reg.GradeLevel
        };
        _context.Students.Add(student);
        await _context.SaveChangesAsync();

        // 3. Auto-Enroll in Selected Course
        var enrollment = new Enrollment
        {
            StudentId = student.Id,
            CourseId = reg.CourseId,
            EnrollmentDate = DateTime.UtcNow,
            IsActive = true
        };
        _context.Enrollments.Add(enrollment);

        // 4. Update Registration record
        reg.Status = RegistrationStatus.VerifiedAndEnrolled;
        reg.PaymentVerifiedAt = DateTime.UtcNow;
        reg.IssuedStudentCode = studentCode;
        reg.CreatedUserId = user.Id;

        // 5. Send Notification
        var notif = new Notification
        {
            UserId = user.Id,
            Title = "🎉 Account Approved & Credentials Issued!",
            Message = $"Welcome to BrightTutor! Your Student ID is {studentCode}. Your default login email is {reg.Email} and password is '{tempPassword}'. Please log in and change your password.",
            Type = NotificationType.GeneralAnnouncement,
            Status = NotificationStatus.Unread
        };
        _context.Notifications.Add(notif);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Payment verified successfully! Student account & ID created.",
            studentCode,
            email = reg.Email,
            tempPassword
        });
    }

    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectRegistration(Guid id, [FromBody] string reason)
    {
        var reg = await _context.StudentRegistrations.FindAsync(id);
        if (reg == null) return NotFound();

        reg.Status = RegistrationStatus.Rejected;
        reg.AdminNotes = reason;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Registration rejected." });
    }
}
