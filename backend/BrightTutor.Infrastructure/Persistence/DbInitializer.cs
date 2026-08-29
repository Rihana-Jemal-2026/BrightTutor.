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

        // 4. Remove Old Test & Duplicate Courses
        var testCourseNames = new[]
        {
            "full-stack web verification course",
            "automated test course",
            "payten",
            "full stack",
            "cyber  security ",
            "ai",
            "networking",
            "digital marketing"
        };

        var coursesToDelete = await context.Courses
            .Where(c => testCourseNames.Contains(c.Name.ToLower().Trim()))
            .ToListAsync();

        if (coursesToDelete.Any())
        {
            context.Courses.RemoveRange(coursesToDelete);
            await context.SaveChangesAsync();
        }

        // 5. Seed Real Academic & Professional Courses
        var targetCourses = new List<Course>
        {
            new Course { Name = "Full-Stack Web Development (React & .NET)", Description = "3-Month Intensive: HTML/CSS, Modern JavaScript, React 19, C# .NET 10 Web API, PostgreSQL.", ServiceType = ServiceType.Group, IsActive = true },
            new Course { Name = "Python Programming & Data Structures", Description = "3-Month Intensive: Python syntax, OOP, Algorithms, Data Structures, Problem Solving.", ServiceType = ServiceType.Online, IsActive = true },
            new Course { Name = "Artificial Intelligence & Machine Learning", Description = "3-Month Intensive: Neural Networks, PyTorch, Model Training, NLP, Computer Vision.", ServiceType = ServiceType.Group, IsActive = true },
            new Course { Name = "Mobile App Development (Flutter & Dart)", Description = "3-Month Intensive: Cross-platform iOS/Android apps, State Management, Firebase Backend.", ServiceType = ServiceType.Group, IsActive = true },
            new Course { Name = "Cybersecurity & Network Defense", Description = "3-Month Intensive: Ethical Hacking, Network Protocols, Penetration Testing, Cryptography.", ServiceType = ServiceType.Online, IsActive = true },
            new Course { Name = "Data Science & Analytics with Python", Description = "3-Month Intensive: Pandas, NumPy, Data Visualization, Statistical Analysis, BigQuery.", ServiceType = ServiceType.Group, IsActive = true },
            new Course { Name = "SAT Math & Verbal Prep Masterclass", Description = "3-Month Intensive: Complete SAT prep, Problem Solving, Practice Exams, Strategy.", ServiceType = ServiceType.HomeToHome, IsActive = true },
            new Course { Name = "Grade 11-12 Physics & Mechanics", Description = "3-Month Intensive: Kinematics, Dynamics, Electromagnetism, Quantum Physics prep.", ServiceType = ServiceType.HomeToHome, IsActive = true },
            new Course { Name = "Advanced Organic & Inorganic Chemistry", Description = "3-Month Intensive: Reaction Mechanisms, Stoichiometry, Molecular Structure.", ServiceType = ServiceType.HomeToHome, IsActive = true },
            new Course { Name = "Calculus & Linear Algebra Mastery", Description = "3-Month Intensive: Differential/Integral Calculus, Matrices, Vector Spaces.", ServiceType = ServiceType.Online, IsActive = true },
            new Course { Name = "English Business Communication & IELTS", Description = "3-Month Intensive: Speaking, Academic Writing, IELTS 8.0 Band Prep.", ServiceType = ServiceType.Online, IsActive = true },
            new Course { Name = "Graphic Design & UI/UX Design (Figma)", Description = "3-Month Intensive: User Interface Design, Wireframing, Color Theory, Figma Prototype.", ServiceType = ServiceType.Group, IsActive = true },
            new Course { Name = "Cloud Computing & DevOps Essentials", Description = "3-Month Intensive: Docker, Kubernetes, CI/CD Pipelines, AWS & GCP Deployment.", ServiceType = ServiceType.Group, IsActive = true },
            new Course { Name = "Database Engineering & SQL Mastery", Description = "3-Month Intensive: Relational Data Modeling, Complex SQL Queries, Performance Tuning.", ServiceType = ServiceType.Online, IsActive = true },
            new Course { Name = "Kids Coding & Scratch Robotics", Description = "3-Month Fun Track: Visual block programming, Game Development, Logic Building.", ServiceType = ServiceType.HomeToHome, IsActive = true },
            new Course { Name = "Digital Marketing & Social Media Strategy", Description = "3-Month Professional Track: SEO, Content Creation, Ad Campaigns, Analytics.", ServiceType = ServiceType.Online, IsActive = true },
            new Course { Name = "Custom / Requested Subject Specialization", Description = "Personalized Tutoring: Custom academic or professional course requested by student.", ServiceType = ServiceType.Online, IsActive = true }
        };

        var existingCourseNames = await context.Courses.Select(c => c.Name.ToLower().Trim()).ToListAsync();
        foreach (var tc in targetCourses)
        {
            if (!existingCourseNames.Contains(tc.Name.ToLower().Trim()))
            {
                context.Courses.Add(tc);
            }
        }

        await context.SaveChangesAsync();
    }
}
