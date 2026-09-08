using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Settings.Commands.UpdateSystemSetting;

public class UpdateSystemSettingHandler : IRequestHandler<UpdateSystemSettingCommand, bool>
{
    private readonly IApplicationDbContext _context;

    public UpdateSystemSettingHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateSystemSettingCommand request, CancellationToken cancellationToken)
    {
        var setting = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == request.Key, cancellationToken);

        if (setting == null)
        {
            setting = new SystemSetting
            {
                Key = request.Key,
                Value = request.Value,
                Description = request.Description
            };
            _context.SystemSettings.Add(setting);
        }
        else
        {
            setting.Value = request.Value;
            if (!string.IsNullOrWhiteSpace(request.Description))
            {
                setting.Description = request.Description;
            }
            setting.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
