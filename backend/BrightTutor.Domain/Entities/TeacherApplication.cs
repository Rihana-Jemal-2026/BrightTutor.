using BrightTutor.Domain.Common;

namespace BrightTutor.Domain.Entities;

public enum TeacherApplicationStatus
{
    PendingScreening = 1,
    ApprovedAvailable = 2,
    Rejected = 3
}

public class TeacherApplication : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public int YearsOfExperience { get; set; }

    public string? CvDocumentUrl { get; set; }
    public string? BackgroundDocUrl { get; set; }
    public string? BioSummary { get; set; }

    public TeacherApplicationStatus Status { get; set; } = TeacherApplicationStatus.PendingScreening;
    public string? RejectionReason { get; set; }

    // Contract SLA Agreement
    public bool HasAcceptedContractSla { get; set; }
    public DateTime? ContractAcceptedAt { get; set; }

    public Guid? CreatedUserId { get; set; }
}
