using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Payroll.Queries.GetTeacherPayroll;

public class GetTeacherPayrollQuery : IRequest<List<TeacherPayrollDto>>
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public Guid? TeacherId { get; set; }
}

public class GetTeacherPayrollHandler : IRequestHandler<GetTeacherPayrollQuery, List<TeacherPayrollDto>>
{
    private readonly IApplicationDbContext _context;

    public GetTeacherPayrollHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<TeacherPayrollDto>> Handle(GetTeacherPayrollQuery request, CancellationToken cancellationToken)
    {
        var teachersQuery = _context.Teachers
            .Include(t => t.User)
            .AsQueryable();

        if (request.TeacherId.HasValue && request.TeacherId.Value != Guid.Empty)
        {
            teachersQuery = teachersQuery.Where(t => t.Id == request.TeacherId.Value || t.UserId == request.TeacherId.Value);
        }

        var teachers = await teachersQuery.ToListAsync(cancellationToken);

        var attendancesQuery = _context.Attendances
            .Include(a => a.ClassGroup).ThenInclude(cg => cg.Course)
            .Where(a => a.Status == AttendanceStatus.Present)
            .AsQueryable();

        if (request.StartDate.HasValue)
        {
            var start = DateOnly.FromDateTime(request.StartDate.Value);
            attendancesQuery = attendancesQuery.Where(a => a.AttendanceDate >= start);
        }

        if (request.EndDate.HasValue)
        {
            var end = DateOnly.FromDateTime(request.EndDate.Value);
            attendancesQuery = attendancesQuery.Where(a => a.AttendanceDate <= end);
        }

        var attendances = await attendancesQuery.ToListAsync(cancellationToken);

        var result = new List<TeacherPayrollDto>();

        foreach (var teacher in teachers)
        {
            var teacherAttendances = attendances.Where(a => a.TeacherId == teacher.Id).ToList();

            var payroll = new TeacherPayrollDto
            {
                TeacherId = teacher.Id,
                TeacherName = $"{teacher.User.FirstName} {teacher.User.LastName}",
                Specialization = teacher.Specialization ?? "General Tutor"
            };

            foreach (var att in teacherAttendances)
            {
                var serviceType = att.ClassGroup?.Course?.ServiceType ?? ServiceType.Online;
                var courseName = att.ClassGroup?.Course?.Name ?? "General Session";

                decimal hours = 1.0m;
                if (att.CheckInTime.HasValue && att.CheckOutTime.HasValue)
                {
                    var durationMinutes = (att.CheckOutTime.Value - att.CheckInTime.Value).TotalMinutes;
                    if (durationMinutes > 0) hours = (decimal)Math.Round(durationMinutes / 60.0, 2);
                }

                decimal rate = 0;
                decimal travel = 0;
                decimal pay = 0;

                switch (serviceType)
                {
                    case ServiceType.Online:
                        rate = 30.00m; // $30/hr
                        pay = hours * rate;
                        payroll.OnlineEarnings += pay;
                        break;
                    case ServiceType.Group:
                        rate = 40.00m; // $40/hr
                        pay = hours * rate;
                        payroll.GroupEarnings += pay;
                        break;
                    case ServiceType.HomeToHome:
                        rate = 50.00m; // $50/visit
                        travel = 10.00m; // $10 travel fee
                        pay = rate + travel;
                        payroll.HomeVisitEarnings += rate;
                        payroll.TravelAllowance += travel;
                        break;
                }

                payroll.TotalHours += hours;
                payroll.TotalSessions++;
                payroll.TotalEarnings += pay;

                payroll.Sessions.Add(new TeacherSessionBreakdownDto
                {
                    AttendanceId = att.Id,
                    CourseName = courseName,
                    ServiceTypeName = serviceType.ToString(),
                    AttendanceDate = att.AttendanceDate,
                    DurationHours = hours,
                    RatePerHourOrVisit = rate,
                    TravelFee = travel,
                    TotalPay = pay
                });
            }

            result.Add(payroll);
        }

        return result;
    }
}
