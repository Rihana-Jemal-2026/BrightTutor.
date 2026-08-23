using AutoMapper;
using BrightTutor.Application.Settings.Queries.GetAcademicCalendars;
using BrightTutor.Application.Settings.Queries.GetSystemSettings;
using BrightTutor.Domain.Entities;

namespace BrightTutor.Application.Common.Mappings;

public class SettingsMappingProfile : Profile
{
    public SettingsMappingProfile()
    {
        CreateMap<SystemSetting, SystemSettingDto>();
        CreateMap<AcademicCalendar, AcademicCalendarDto>();
    }
}
