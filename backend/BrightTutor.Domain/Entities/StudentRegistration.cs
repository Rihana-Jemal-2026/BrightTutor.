using BrightTutor.Domain.Common;
using BrightTutor.Domain.Enums;

namespace BrightTutor.Domain.Entities;

public enum RegistrationStatus
{
    PendingApproval = 1,
    ApprovedPendingPayment = 2,
    PaymentSubmitted = 3,
    VerifiedAndEnrolled = 4,
    Rejected = 5
}

public class StudentRegistration : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string GradeLevel { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public decimal? GpsLatitude { get; set; }
    public decimal? GpsLongitude { get; set; }

    public ServiceType DesiredServiceType { get; set; }
    public Guid CourseId { get; set; }

    public RegistrationStatus Status { get; set; } = RegistrationStatus.PendingApproval;
    public string? AdminNotes { get; set; }

    // Payment Slip Details (Telebirr / CBE Birr)
    public string? PaymentChannel { get; set; } // "CBE Birr", "Telebirr", "Bank Transfer"
    public string? TransactionId { get; set; }
    public decimal? AmountPaid { get; set; }
    public string? ReceiptImageBase64 { get; set; }
    public DateTime? PaymentSubmittedAt { get; set; }
    public DateTime? PaymentVerifiedAt { get; set; }

    // Issued Credentials
    public string? IssuedStudentCode { get; set; }
    public Guid? CreatedUserId { get; set; }
}
