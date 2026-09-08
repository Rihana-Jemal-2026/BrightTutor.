using AutoMapper;
using BrightTutor.Application.ClassGroups.Queries.GetClassGroupsList;
using BrightTutor.Application.Courses.Queries.GetCoursesList;
using BrightTutor.Domain.Entities;

namespace BrightTutor.Application.Common.Mappings;

public class CourseMappingProfile : Profile
{
    public CourseMappingProfile()
    {
        CreateMap<Course, CourseDto>();
        CreateMap<ClassGroup, ClassGroupDto>()
            .ForMember(dest => dest.CourseName, opt => opt.MapFrom(src => src.Course.Name));
    }
}
