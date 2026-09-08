using AutoMapper;
using BrightTutor.Application.Abstractions.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Settings.Queries.GetSystemSettings;

public class GetSystemSettingsHandler : IRequestHandler<GetSystemSettingsQuery, List<SystemSettingDto>>
{
    private readonly IApplicationDbContext _context;
    private readonly IMapper _mapper;

    public GetSystemSettingsHandler(IApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<SystemSettingDto>> Handle(GetSystemSettingsQuery request, CancellationToken cancellationToken)
    {
        var settings = await _context.SystemSettings
            .OrderBy(s => s.Key)
            .ToListAsync(cancellationToken);

        return _mapper.Map<List<SystemSettingDto>>(settings);
    }
}
