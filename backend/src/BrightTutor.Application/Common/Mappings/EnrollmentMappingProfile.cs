using AutoMapper;
using BrightTutor.Application.Enrollments.Queries.GetStudentEnrollments;
using BrightTutor.Application.TeacherAssignments.Queries.GetTeacherAssignments;
using BrightTutor.Domain.Entities;

namespace BrightTutor.Application.Common.Mappings;

public class EnrollmentMappingProfile : Profile
{
    public EnrollmentMappingProfile()
    {
        CreateMap<Enrollment, EnrollmentDto>()
            .ForMember(dest => dest.CourseName, opt => opt.MapFrom(src => src.Course.Name))
            .ForMember(dest => dest.ClassGroupName, opt => opt.MapFrom(src => src.ClassGroup != null ? src.ClassGroup.Name : null))
            .ForMember(dest => dest.StudentCode, opt => opt.MapFrom(src => src.Student.StudentCode))
            .ForMember(dest => dest.StudentName, opt => opt.MapFrom(src => src.Student.User != null ? $"{src.Student.User.FirstName} {src.Student.User.LastName}" : string.Empty));

        CreateMap<TeacherAssignment, TeacherAssignmentDto>()
            .ForMember(dest => dest.CourseName, opt => opt.MapFrom(src => src.Course.Name))
            .ForMember(dest => dest.ClassGroupName, opt => opt.MapFrom(src => src.ClassGroup != null ? src.ClassGroup.Name : null))
            .ForMember(dest => dest.TeacherCode, opt => opt.MapFrom(src => src.Teacher.TeacherCode))
            .ForMember(dest => dest.TeacherName, opt => opt.MapFrom(src => src.Teacher.User != null ? $"{src.Teacher.User.FirstName} {src.Teacher.User.LastName}" : string.Empty));
    }
}
