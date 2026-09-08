using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using BrightTutor.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BrightTutor.Api.Services;
using BrightTutor.Application.Abstractions.Authentication;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class QrAttendanceController : ControllerBase
{
    private readonly IApplicationDbContext _context;
    private readonly AttendanceChallengeStore _challenges;
    private readonly ICurrentUserService _user;
    private readonly TimeProvider _clock;

    public QrAttendanceController(IApplicationDbContext context, AttendanceChallengeStore challenges, ICurrentUserService user, TimeProvider clock)
    {
        _context = context;
        _challenges = challenges;
        _user = user;
        _clock = clock;
    }

    private async Task<bool> CanManageGroup(Guid group) => _user.Role == UserRole.Admin ||
        (_user.Role == UserRole.Teacher && await _context.TeacherAssignments.AnyAsync(a =>
            a.ClassGroupId == group && a.Teacher.UserId == _user.UserId &&
            a.StartDate <= DateTime.UtcNow && (a.EndDate == null || a.EndDate > DateTime.UtcNow)));

    private async Task<bool> CanCheckIn(Student student, Guid group) =>
        ((_user.Role == UserRole.Student && student.UserId == _user.UserId) || await CanManageGroup(group)) &&
        await _context.Enrollments.AnyAsync(e => e.StudentId == student.Id && e.ClassGroupId == group && e.IsActive &&
            (e.EndDate == null || e.EndDate > DateTime.UtcNow));

    public record ChallengeRequest(Guid StudentId, Guid ClassGroupId, string QrNonce);

    [HttpPost("liveness-challenge")]
    public async Task<IActionResult> IssueChallenge(ChallengeRequest dto)
    {
        var student = await _context.Students.FirstOrDefaultAsync(s => s.Id == dto.StudentId || s.UserId == dto.StudentId);
        if (student == null) return NotFound(new { message = "Student profile not found." });
        if (!await CanCheckIn(student, dto.ClassGroupId)) return Forbid();
        if (AttendanceLiveness.ParseDescriptor(student.FaceDescriptorJson) == null)
            return BadRequest(new { message = "Ask an administrator to enroll your face, or ask your teacher to mark attendance manually." });
        var challenge = _challenges.Issue(_user.UserId!.Value, student.Id, dto.ClassGroupId, dto.QrNonce);
        if (challenge == null) return BadRequest(new { code = "QR_SESSION_INVALID", message = "This classroom QR is no longer active. Ask your teacher for the current classroom token." });
        return Ok(new { challenge.Id, challenge.Actions, challenge.IssuedAt, challenge.ExpiresAt });
    }

    [HttpGet("generate-session-qr")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GenerateSessionQr([FromQuery] Guid classGroupId, [FromQuery] bool refresh = false)
    {
        if (!await CanManageGroup(classGroupId)) return Forbid();
        var group = await _context.ClassGroups.Include(g => g.Course).FirstOrDefaultAsync(g => g.Id == classGroupId);
        if (group == null) return NotFound(new { message = "Class Group not found." });

        var session = _challenges.CreateSession(group.Id, refresh);
        var tokenPayload = new
        {
            classGroupId = group.Id,
            courseName = group.Course?.Name,
            groupName = group.Name,
            timestamp = DateTime.UtcNow.ToString("o"),
            location = "BrightTutor Academy - In-Person Center Hall A",
            qrNonce = session.Nonce,
            expiresAt = session.ExpiresAt
        };

        return Ok(tokenPayload);
    }

    public class QrScanCheckInDto
    {
        public Guid StudentId { get; set; }
        public Guid ClassGroupId { get; set; }
        public string QrNonce { get; set; } = string.Empty;
        public bool FaceVerified { get; set; } = true;
        public string? FaceSnapshotBase64 { get; set; }
        public double? FaceMatchConfidence { get; set; }
        public string? FaceDescriptorJson { get; set; }
        public string ChallengeId { get; set; } = string.Empty;
        public List<LivenessSample>? Samples { get; set; }
    }

    [HttpPost("scan-check-in")]
    [RequestSizeLimit(2_000_000)]
    public async Task<IActionResult> ScanCheckIn([FromBody] QrScanCheckInDto dto)
    {
        var student = await _context.Students.Include(s => s.User).FirstOrDefaultAsync(s => s.Id == dto.StudentId || s.UserId == dto.StudentId);
        if (student == null) return NotFound(new { message = "Student profile not found." });

        var group = await _context.ClassGroups.Include(g => g.Course).FirstOrDefaultAsync(g => g.Id == dto.ClassGroupId);
        if (group == null) return NotFound(new { message = "Class Group not found." });

        if (!await CanCheckIn(student, dto.ClassGroupId)) return Forbid();
        var challenge = _challenges.Consume(dto.ChallengeId, _user.UserId!.Value, student.Id, dto.ClassGroupId, dto.QrNonce);
        var reference = AttendanceLiveness.ParseDescriptor(student.FaceDescriptorJson);
        if (challenge == null || reference == null ||
            !AttendanceLiveness.Validate(challenge, dto.Samples, reference, _clock.GetUtcNow(), out var similarity))
            return BadRequest(new { message = "Camera check incomplete, expired, or already used. Start a new camera check." });
        dto.FaceMatchConfidence = similarity;

        // Lookup Teacher Assignment for this group
        var assignment = await _context.TeacherAssignments.FirstOrDefaultAsync(a => a.ClassGroupId == dto.ClassGroupId);
        var teacherId = assignment?.TeacherId ?? Guid.Empty;

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var existing = await _context.Attendances.FirstOrDefaultAsync(a =>
            a.StudentId == student.Id &&
            a.ClassGroupId == dto.ClassGroupId &&
            a.AttendanceDate == today);

        var now = DateTime.UtcNow;
        var isLate = now.Hour >= 9 && now.Minute > 15;
        var status = isLate ? AttendanceStatus.Late : AttendanceStatus.Present;

        var auditNote = $"QR + interactive camera challenge {challenge.Id} completed by {_user.UserId} at {now:O}";

        if (existing != null)
        {
            existing.Status = status;
            existing.CheckInTime = now;
            existing.FaceSnapshotBase64 = dto.FaceSnapshotBase64;
            existing.FaceMatchConfidence = dto.FaceMatchConfidence;
            existing.Notes = auditNote;
        }
        else
        {
            var att = new Attendance
            {
                StudentId = student.Id,
                TeacherId = teacherId != Guid.Empty ? teacherId : (await _context.Teachers.FirstOrDefaultAsync())?.Id ?? Guid.Empty,
                ClassGroupId = dto.ClassGroupId,
                AttendanceDate = today,
                CheckInTime = now,
                Status = status,
                FaceSnapshotBase64 = dto.FaceSnapshotBase64,
                FaceMatchConfidence = dto.FaceMatchConfidence,
                Notes = auditNote
            };
            _context.Attendances.Add(att);
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Attendance recorded for {student.User?.FirstName} {student.User?.LastName}. Classroom token and camera challenge completed.",
            status = status.ToString(),
            checkInTime = now.ToString("g"),
            faceConfidence = dto.FaceMatchConfidence
        });
    }

    [HttpGet("live-attendees")]
    public async Task<IActionResult> GetLiveAttendees([FromQuery] Guid classGroupId)
    {
        if (!await CanManageGroup(classGroupId)) return Forbid();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var list = await _context.Attendances
            .Include(a => a.Student)
                .ThenInclude(s => s.User)
            .Where(a => a.ClassGroupId == classGroupId && a.AttendanceDate == today)
            .OrderByDescending(a => a.CheckInTime)
            .Select(a => new
            {
                attendanceId = a.Id,
                studentId = a.StudentId,
                studentName = $"{a.Student.User.FirstName} {a.Student.User.LastName}",
                studentCode = a.Student.StudentCode,
                referencePhotoUrl = a.Student.ProfilePhotoUrl,
                liveSnapshotUrl = a.FaceSnapshotBase64,
                matchConfidence = a.FaceMatchConfidence,
                checkInTime = a.CheckInTime.HasValue ? a.CheckInTime.Value.ToString("HH:mm:ss") : "Just now",
                status = a.Status.ToString()
            })
            .ToListAsync();

        return Ok(list);
    }
}
