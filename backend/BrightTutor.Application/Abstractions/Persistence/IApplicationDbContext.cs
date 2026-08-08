using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Application.Abstractions.Persistence;

public interface IApplicationDbContext
{
    DbSet<BrightTutor.Domain.Entities.Attendance> Attendances { get; }
    DbSet<BrightTutor.Domain.Entities.HomeAttendance> HomeAttendances { get; }
    DbSet<BrightTutor.Domain.Entities.TeacherAttendance> TeacherAttendances { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}