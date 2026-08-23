using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using MediatR;

namespace BrightTutor.Application.Settings.Commands.CreateAcademicCalendar;

public class CreateAcademicCalendarHandler : IRequestHandler<CreateAcademicCalendarCommand, CreateAcademicCalendarResponse>
{
    private readonly IApplicationDbContext _context;

    public CreateAcademicCalendarHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CreateAcademicCalendarResponse> Handle(CreateAcademicCalendarCommand request, CancellationToken cancellationToken)
    {
        if (request.EndDate <= request.StartDate)
        {
            throw new InvalidOperationException("EndDate must be later than StartDate.");
        }

        var calendar = new AcademicCalendar
        {
            Title = request.Title,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsActive = request.IsActive
        };

        _context.AcademicCalendars.Add(calendar);
        await _context.SaveChangesAsync(cancellationToken);

        return new CreateAcademicCalendarResponse
        {
            Id = calendar.Id,
            Title = calendar.Title,
            StartDate = calendar.StartDate,
            EndDate = calendar.EndDate,
            IsActive = calendar.IsActive
        };
    }
}
