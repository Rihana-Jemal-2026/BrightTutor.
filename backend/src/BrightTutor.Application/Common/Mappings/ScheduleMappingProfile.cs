using AutoMapper;
using BrightTutor.Application.Schedules.Queries.GetSchedulesList;
using BrightTutor.Domain.Entities;

namespace BrightTutor.Application.Common.Mappings;

public class ScheduleMappingProfile : Profile
{
    public ScheduleMappingProfile()
    {
        CreateMap<Schedule, ScheduleDto>()
            .ForMember(dest => dest.CourseName, opt => opt.MapFrom(src => src.Course.Name))
            .ForMember(dest => dest.TeacherCode, opt => opt.MapFrom(src => src.Teacher.TeacherCode))
            .ForMember(dest => dest.TeacherName, opt => opt.MapFrom(src => src.Teacher.User != null ? $"{src.Teacher.User.FirstName} {src.Teacher.User.LastName}" : string.Empty))
            .ForMember(dest => dest.ClassGroupName, opt => opt.MapFrom(src => src.ClassGroup != null ? src.ClassGroup.Name : null))
            .ForMember(dest => dest.StudentCode, opt => opt.MapFrom(src => src.Student != null ? src.Student.StudentCode : null))
            .ForMember(dest => dest.StudentName, opt => opt.MapFrom(src => src.Student != null && src.Student.User != null ? $"{src.Student.User.FirstName} {src.Student.User.LastName}" : null));
    }
}
