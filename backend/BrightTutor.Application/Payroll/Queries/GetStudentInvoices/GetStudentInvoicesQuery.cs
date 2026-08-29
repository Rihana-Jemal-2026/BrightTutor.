using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Payroll.Queries.GetStudentInvoices;

public class GetStudentInvoicesQuery : IRequest<List<StudentInvoiceDto>>
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public Guid? StudentId { get; set; }
}

public class GetStudentInvoicesHandler : IRequestHandler<GetStudentInvoicesQuery, List<StudentInvoiceDto>>
{
    private readonly IApplicationDbContext _context;

    public GetStudentInvoicesHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<StudentInvoiceDto>> Handle(GetStudentInvoicesQuery request, CancellationToken cancellationToken)
    {
        var studentsQuery = _context.Students
            .Include(s => s.User)
            .AsQueryable();

        if (request.StudentId.HasValue && request.StudentId.Value != Guid.Empty)
        {
            studentsQuery = studentsQuery.Where(s => s.Id == request.StudentId.Value || s.UserId == request.StudentId.Value);
        }

        var students = await studentsQuery.ToListAsync(cancellationToken);

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

        var result = new List<StudentInvoiceDto>();

        foreach (var student in students)
        {
            var studentAttendances = attendances.Where(a => a.StudentId == student.Id).ToList();

            var invoice = new StudentInvoiceDto
            {
                StudentId = student.Id,
                StudentName = $"{student.User.FirstName} {student.User.LastName}",
                StudentCode = student.StudentCode,
                GradeLevel = student.GradeLevel ?? "Standard Grade"
            };

            foreach (var att in studentAttendances)
            {
                var serviceType = att.ClassGroup?.Course?.ServiceType ?? ServiceType.Online;
                var courseName = att.ClassGroup?.Course?.Name ?? "Tutoring Session";

                decimal hours = 1.0m;
                if (att.CheckInTime.HasValue && att.CheckOutTime.HasValue)
                {
                    var durationMinutes = (att.CheckOutTime.Value - att.CheckInTime.Value).TotalMinutes;
                    if (durationMinutes > 0) hours = (decimal)Math.Round(durationMinutes / 60.0, 2);
                }

                decimal rate = 0;
                decimal amount = 0;

                switch (serviceType)
                {
                    case ServiceType.Online:
                        rate = 45.00m; // $45/hr for 1-on-1 Online
                        amount = hours * rate;
                        invoice.OnlineTotal += amount;
                        break;
                    case ServiceType.Group:
                        rate = 25.00m; // $25/hr per student for Group Session
                        amount = hours * rate;
                        invoice.GroupTotal += amount;
                        break;
                    case ServiceType.HomeToHome:
                        rate = 75.00m; // $75 per Home Visit Session
                        amount = rate;
                        invoice.HomeVisitTotal += amount;
                        break;
                }

                invoice.TotalSessionsAttended++;
                invoice.TotalAmountDue += amount;

                invoice.LineItems.Add(new StudentSessionLineItemDto
                {
                    AttendanceId = att.Id,
                    CourseName = courseName,
                    ServiceTypeName = serviceType.ToString(),
                    SessionDate = att.AttendanceDate,
                    DurationHours = hours,
                    Rate = rate,
                    Amount = amount
                });
            }

            result.Add(invoice);
        }

        return result;
    }
}
