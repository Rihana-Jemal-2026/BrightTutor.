using BrightTutor.Application.Abstractions.Authentication;
using BrightTutor.Domain.Entities;
using BrightTutor.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedAsync(ApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        // 1. Seed Fixed System Permissions (15 Permissions)
        if (!await context.Permissions.AnyAsync())
        {
            var permissions = new List<Permission>
            {
                // Users Module
                new Permission { Code = "users.view", Name = "View Users", Module = "Users", Description = "View users list and profile details" },
                new Permission { Code = "users.create", Name = "Create User", Module = "Users", Description = "Register and create new users" },
                new Permission { Code = "users.update", Name = "Update User", Module = "Users", Description = "Modify user details and status" },
                new Permission { Code = "users.delete", Name = "Delete User", Module = "Users", Description = "Remove users from the system" },

                // Courses Module
                new Permission { Code = "courses.view", Name = "View Courses", Module = "Courses", Description = "View courses and class groups" },
                new Permission { Code = "courses.manage", Name = "Manage Courses", Module = "Courses", Description = "Create, edit, and assign courses & class groups" },

                // Schedules Module
                new Permission { Code = "schedules.view", Name = "View Schedules", Module = "Schedules", Description = "View class timetables and schedules" },
                new Permission { Code = "schedules.manage", Name = "Manage Schedules", Module = "Schedules", Description = "Create and update class schedules" },

                // Attendance Module
                new Permission { Code = "attendance.view", Name = "View Attendance", Module = "Attendance", Description = "View attendance records and logs" },
                new Permission { Code = "attendance.mark", Name = "Mark Attendance", Module = "Attendance", Description = "Submit group, online, or home visit attendance" },

                // Notifications Module
                new Permission { Code = "notifications.view", Name = "View Notifications", Module = "Notifications", Description = "View in-app notifications and announcements" },
                new Permission { Code = "notifications.send", Name = "Send Notifications", Module = "Notifications", Description = "Broadcast notifications and announcements" },

                // Dashboard & Settings
                new Permission { Code = "dashboard.view", Name = "View Dashboard", Module = "Dashboard", Description = "Access executive admin dashboard summary" },
                new Permission { Code = "settings.manage", Name = "Manage Settings", Module = "Settings", Description = "Modify platform settings and configurations" },
                new Permission { Code = "calendar.manage", Name = "Manage Academic Calendar", Module = "Settings", Description = "Create and update academic calendars" }
            };

            context.Permissions.AddRange(permissions);
            await context.SaveChangesAsync();
        }

        // 2. Seed Default Role-Permission Mappings
        if (!await context.RolePermissions.AnyAsync())
        {
            var allPermissions = await context.Permissions.ToListAsync();
            var permMap = allPermissions.ToDictionary(p => p.Code, p => p.Id);

            var rolePermissions = new List<RolePermission>();

            // Admin Role -> Granted ALL Permissions
            foreach (var perm in allPermissions)
            {
                rolePermissions.Add(new RolePermission { Role = UserRole.Admin, PermissionId = perm.Id });
            }

            // Teacher Role -> Granted Teaching & Attendance Permissions
            var teacherPerms = new[] { "courses.view", "schedules.view", "schedules.manage", "attendance.view", "attendance.mark", "notifications.view" };
            foreach (var code in teacherPerms)
            {
                if (permMap.TryGetValue(code, out var permId))
                {
                    rolePermissions.Add(new RolePermission { Role = UserRole.Teacher, PermissionId = permId });
                }
            }

            // Student Role -> Granted Student View Permissions
            var studentPerms = new[] { "courses.view", "schedules.view", "attendance.view", "notifications.view" };
            foreach (var code in studentPerms)
            {
                if (permMap.TryGetValue(code, out var permId))
                {
                    rolePermissions.Add(new RolePermission { Role = UserRole.Student, PermissionId = permId });
                }
            }

            // Parent Role -> Granted Parent View Permissions
            var parentPerms = new[] { "schedules.view", "attendance.view", "notifications.view" };
            foreach (var code in parentPerms)
            {
                if (permMap.TryGetValue(code, out var permId))
                {
                    rolePermissions.Add(new RolePermission { Role = UserRole.Parent, PermissionId = permId });
                }
            }

            context.RolePermissions.AddRange(rolePermissions);
            await context.SaveChangesAsync();
        }

        // 3. Seed Default Admin User if no users exist
        if (!await context.Users.AnyAsync())
        {
            var adminUser = new User
            {
                FirstName = "Super",
                LastName = "Admin",
                Email = "admin@brighttutor.com",
                PhoneNumber = "+1234567890",
                Role = UserRole.Admin,
                Status = UserStatus.Active,
                PasswordHash = passwordHasher.HashPassword("AdminPass123!")
            };

            context.Users.Add(adminUser);

            context.Admins.Add(new Admin
            {
                UserId = adminUser.Id,
                AdminCode = "ADM-000001"
            });
        }

        // 4. Seed Default System Settings if empty
        if (!await context.SystemSettings.AnyAsync())
        {
            context.SystemSettings.AddRange(new List<SystemSetting>
            {
                new SystemSetting { Key = "SystemName", Value = "BrightTutor", Description = "Platform brand name" },
                new SystemSetting { Key = "AttendanceRadiusMeters", Value = "300", Description = "Allowed GPS radius for home visit check-in (in meters)" },
                new SystemSetting { Key = "AllowRegistration", Value = "true", Description = "Controls whether public user registration is enabled" },
                new SystemSetting { Key = "DefaultCurrency", Value = "USD", Description = "Default billing currency" }
            });
        }

        await context.SaveChangesAsync();
    }
}
