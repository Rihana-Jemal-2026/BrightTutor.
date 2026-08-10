using BrightTutor.Domain.Enums;

namespace BrightTutor.Application.Attendance.Queries.GetStudentAttendanceCalendar;

public class CalendarDayDto
{
    public DateOnly Date { get; set; }
    public AttendanceStatus Status { get; set; }
    public AttendanceType AttendanceType { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public Guid TeacherId { get; set; }
}