using AutoMapper;
using BrightTutor.Application.Users.Queries.GetUsersList;
using BrightTutor.Application.Students.Queries.GetStudentsList;
using BrightTutor.Application.Teachers.Queries.GetTeachersList;
using BrightTutor.Domain.Entities;

namespace BrightTutor.Application.Common.Mappings;

public class UserMappingProfile : Profile
{
    public UserMappingProfile()
    {
        CreateMap<User, UserDto>();

        CreateMap<Student, StudentDto>()
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.User.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.User.LastName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.User.Email))
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.User.PhoneNumber))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.User.Status));

        CreateMap<Teacher, TeacherDto>()
            .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.User.FirstName))
            .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.User.LastName))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.User.Email))
            .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.User.PhoneNumber))
            .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.User.Status));
    }
}
