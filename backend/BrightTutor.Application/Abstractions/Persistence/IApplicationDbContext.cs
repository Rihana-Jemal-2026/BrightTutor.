using BrightTutor.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using DomainAttendance = BrightTutor.Domain.Entities.Attendance;
using DomainHomeAttendance = BrightTutor.Domain.Entities.HomeAttendance;
using DomainTeacherAttendance = BrightTutor.Domain.Entities.TeacherAttendance;

namespace BrightTutor.Application.Abstractions.Persistence;

public interface IApplicationDbContext
{
    DbSet<DomainAttendance> Attendances { get; }
    DbSet<DomainHomeAttendance> HomeAttendances { get; }
    DbSet<DomainTeacherAttendance> TeacherAttendances { get; }

    DbSet<User> Users { get; }
    DbSet<Student> Students { get; }
    DbSet<Teacher> Teachers { get; }
    DbSet<Admin> Admins { get; }
    DbSet<Parent> Parents { get; }

    DbSet<Course> Courses { get; }
    DbSet<ClassGroup> ClassGroups { get; }

    DbSet<Enrollment> Enrollments { get; }
    DbSet<TeacherAssignment> TeacherAssignments { get; }

    DbSet<Schedule> Schedules { get; }

    DbSet<Notification> Notifications { get; }
    DbSet<Announcement> Announcements { get; }

    DbSet<SystemSetting> SystemSettings { get; }
    DbSet<AcademicCalendar> AcademicCalendars { get; }

    DbSet<Permission> Permissions { get; }
    DbSet<RolePermission> RolePermissions { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}