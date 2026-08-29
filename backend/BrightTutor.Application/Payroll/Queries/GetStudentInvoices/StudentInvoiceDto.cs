namespace BrightTutor.Application.Payroll.Queries.GetStudentInvoices;

public class StudentInvoiceDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
    public string GradeLevel { get; set; } = string.Empty;
    public decimal TotalAmountDue { get; set; }
    public int TotalSessionsAttended { get; set; }
    public decimal OnlineTotal { get; set; }
    public decimal GroupTotal { get; set; }
    public decimal HomeVisitTotal { get; set; }
    public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
    public List<StudentSessionLineItemDto> LineItems { get; set; } = [];
}

public class StudentSessionLineItemDto
{
    public Guid AttendanceId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string ServiceTypeName { get; set; } = string.Empty;
    public DateOnly SessionDate { get; set; }
    public decimal DurationHours { get; set; }
    public decimal Rate { get; set; }
    public decimal Amount { get; set; }
}
