using AutoMapper;
using BrightTutor.Application.Attendance.Dtos;

namespace BrightTutor.Application.Common.Mappings;

public class AttendanceMappingProfile : Profile
{
    public AttendanceMappingProfile()
    {
        CreateMap<BrightTutor.Domain.Entities.Attendance, GetGroupAttendanceResponse>();
        CreateMap<BrightTutor.Domain.Entities.TeacherAttendance, GetTeacherAttendanceResponse>();
        CreateMap<BrightTutor.Domain.Entities.Attendance, GetOnlineAttendanceResponse>();
    }
}