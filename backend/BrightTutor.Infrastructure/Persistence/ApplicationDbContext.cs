using BrightTutor.Application.Abstractions.Persistence;
using BrightTutor.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<HomeAttendance> HomeAttendances => Set<HomeAttendance>();
    public DbSet<TeacherAttendance> TeacherAttendances => Set<TeacherAttendance>();
}