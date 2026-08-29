namespace BrightTutor.Application.Payroll.Queries.GetTeacherPayroll;

public class TeacherPayrollDto
{
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public decimal TotalEarnings { get; set; }
    public decimal TotalHours { get; set; }
    public int TotalSessions { get; set; }
    public decimal OnlineEarnings { get; set; }
    public decimal GroupEarnings { get; set; }
    public decimal HomeVisitEarnings { get; set; }
    public decimal TravelAllowance { get; set; }
    public List<TeacherSessionBreakdownDto> Sessions { get; set; } = [];
}

public class TeacherSessionBreakdownDto
{
    public Guid AttendanceId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string ServiceTypeName { get; set; } = string.Empty;
    public DateOnly AttendanceDate { get; set; }
    public decimal DurationHours { get; set; }
    public decimal RatePerHourOrVisit { get; set; }
    public decimal TravelFee { get; set; }
    public decimal TotalPay { get; set; }
}
