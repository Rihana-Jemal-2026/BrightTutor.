using BrightTutor.Domain.Enums;

namespace BrightTutor.Application.Attendance.Dtos;

public class StudentAttendanceEntryDto
{
    public Guid StudentId { get; set; }
    public AttendanceStatus Status { get; set; }
    public string? Notes { get; set; }
}