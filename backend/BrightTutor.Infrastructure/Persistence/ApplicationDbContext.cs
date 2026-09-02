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

    public DbSet<User> Users => Set<User>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Teacher> Teachers => Set<Teacher>();
    public DbSet<Admin> Admins => Set<Admin>();
    public DbSet<Parent> Parents => Set<Parent>();

    public DbSet<Course> Courses => Set<Course>();
    public DbSet<ClassGroup> ClassGroups => Set<ClassGroup>();

    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<TeacherAssignment> TeacherAssignments => Set<TeacherAssignment>();

    public DbSet<Schedule> Schedules => Set<Schedule>();

    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Announcement> Announcements => Set<Announcement>();

    public DbSet<SystemSetting> SystemSettings => Set<SystemSetting>();
    public DbSet<AcademicCalendar> AcademicCalendars => Set<AcademicCalendar>();

    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

    public DbSet<StudentRegistration> StudentRegistrations => Set<StudentRegistration>();
    public DbSet<TeacherApplication> TeacherApplications => Set<TeacherApplication>();
    public DbSet<Certificate> Certificates => Set<Certificate>();

    public DbSet<Assessment> Assessments => Set<Assessment>();
    public DbSet<AssessmentSubmission> AssessmentSubmissions => Set<AssessmentSubmission>();
    public DbSet<FinalCourseGrade> FinalCourseGrades => Set<FinalCourseGrade>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(builder =>
        {
            builder.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Student>(builder =>
        {
            builder.HasIndex(s => s.StudentCode).IsUnique();
            builder.HasOne(s => s.User).WithMany().HasForeignKey(s => s.UserId);
            builder.HasOne(s => s.Parent).WithMany().HasForeignKey(s => s.ParentId).IsRequired(false);
        });

        modelBuilder.Entity<Teacher>(builder =>
        {
            builder.HasIndex(t => t.TeacherCode).IsUnique();
            builder.HasOne(t => t.User).WithMany().HasForeignKey(t => t.UserId);
        });

        modelBuilder.Entity<Admin>(builder =>
        {
            builder.HasIndex(a => a.AdminCode).IsUnique();
            builder.HasOne(a => a.User).WithMany().HasForeignKey(a => a.UserId);
        });

        modelBuilder.Entity<Parent>(builder =>
        {
            builder.HasIndex(p => p.ParentCode).IsUnique();
            builder.HasOne(p => p.User).WithMany().HasForeignKey(p => p.UserId);
        });

        modelBuilder.Entity<Course>(builder =>
        {
            builder.HasIndex(c => c.Name);
            builder.HasMany(c => c.ClassGroups).WithOne(g => g.Course).HasForeignKey(g => g.CourseId);
        });

        modelBuilder.Entity<ClassGroup>(builder =>
        {
            builder.HasIndex(g => g.Name);
        });

        modelBuilder.Entity<Enrollment>(builder =>
        {
            builder.HasOne(e => e.Student).WithMany().HasForeignKey(e => e.StudentId);
            builder.HasOne(e => e.Course).WithMany().HasForeignKey(e => e.CourseId);
            builder.HasOne(e => e.ClassGroup).WithMany().HasForeignKey(e => e.ClassGroupId).IsRequired(false);
        });

        modelBuilder.Entity<TeacherAssignment>(builder =>
        {
            builder.HasOne(a => a.Teacher).WithMany().HasForeignKey(a => a.TeacherId);
            builder.HasOne(a => a.Course).WithMany().HasForeignKey(a => a.CourseId);
            builder.HasOne(a => a.ClassGroup).WithMany().HasForeignKey(a => a.ClassGroupId).IsRequired(false);
        });

        modelBuilder.Entity<Schedule>(builder =>
        {
            builder.HasIndex(s => s.StartTime);
            builder.HasOne(s => s.Course).WithMany().HasForeignKey(s => s.CourseId);
            builder.HasOne(s => s.Teacher).WithMany().HasForeignKey(s => s.TeacherId);
            builder.HasOne(s => s.ClassGroup).WithMany().HasForeignKey(s => s.ClassGroupId).IsRequired(false);
            builder.HasOne(s => s.Student).WithMany().HasForeignKey(s => s.StudentId).IsRequired(false);
        });

        modelBuilder.Entity<Notification>(builder =>
        {
            builder.HasIndex(n => n.UserId);
            builder.HasIndex(n => n.Status);
            builder.HasOne(n => n.User).WithMany().HasForeignKey(n => n.UserId);
        });

        modelBuilder.Entity<Announcement>(builder =>
        {
            builder.HasIndex(a => a.CreatedAt);
            builder.HasOne(a => a.CreatedByUser).WithMany().HasForeignKey(a => a.CreatedByUserId);
        });

        modelBuilder.Entity<SystemSetting>(builder =>
        {
            builder.HasIndex(s => s.Key).IsUnique();
        });

        modelBuilder.Entity<AcademicCalendar>(builder =>
        {
            builder.HasIndex(c => c.StartDate);
        });

        modelBuilder.Entity<Attendance>(builder =>
        {
            builder.HasIndex(a => a.AttendanceDate);
            builder.HasOne(a => a.Student).WithMany().HasForeignKey(a => a.StudentId);
            builder.HasOne(a => a.Teacher).WithMany().HasForeignKey(a => a.TeacherId);
            builder.HasOne(a => a.ClassGroup).WithMany().HasForeignKey(a => a.ClassGroupId);
            builder.HasOne(a => a.Schedule).WithMany().HasForeignKey(a => a.ScheduleId).IsRequired(false);
        });

        modelBuilder.Entity<TeacherAttendance>(builder =>
        {
            builder.HasIndex(ta => ta.AttendanceDate);
            builder.HasOne(ta => ta.Teacher).WithMany().HasForeignKey(ta => ta.TeacherId);
        });

        modelBuilder.Entity<Permission>(builder =>
        {
            builder.HasIndex(p => p.Code).IsUnique();
        });

        modelBuilder.Entity<RolePermission>(builder =>
        {
            builder.HasIndex(rp => new { rp.Role, rp.PermissionId }).IsUnique();
            builder.HasOne(rp => rp.Permission).WithMany(p => p.RolePermissions).HasForeignKey(rp => rp.PermissionId);
        });
    }
}