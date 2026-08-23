using MediatR;

namespace BrightTutor.Application.Settings.Queries.GetSystemSettings;

public class GetSystemSettingsQuery : IRequest<List<SystemSettingDto>>
{
}
