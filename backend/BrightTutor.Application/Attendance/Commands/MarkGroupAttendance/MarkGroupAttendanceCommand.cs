using BrightTutor.Application.Attendance.Dtos;
using MediatR;

namespace BrightTutor.Application.Attendance.Commands.MarkGroupAttendance;

public class MarkGroupAttendanceCommand : IRequest<MarkGroupAttendanceResponse>
{
    public Guid ClassGroupId { get; set; }
    public Guid TeacherId { get; set; }
    public DateOnly AttendanceDate { get; set; }
    public List<StudentAttendanceEntryDto> Students { get; set; } = [];
}