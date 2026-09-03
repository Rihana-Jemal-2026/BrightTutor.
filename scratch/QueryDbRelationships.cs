using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using BrightTutor.Infrastructure.Persistence;

var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=brighttutor;Username=postgres;Password=Abd0946");

using var context = new ApplicationDbContext(optionsBuilder.Options);

Console.WriteLine("================================================================================");
Console.WriteLine("1. REGISTERED TEACHERS IN DATABASE");
Console.WriteLine("================================================================================");
var teachers = context.Teachers.Include(t => t.User).ToList();
foreach (var t in teachers)
{
    Console.WriteLine($"Teacher ID: {t.Id} | Code: {t.TeacherCode} | Name: {t.User?.FirstName} {t.User?.LastName} | Email: {t.User?.Email} | Specialization: {t.Specialization}");
}

Console.WriteLine("\n================================================================================");
Console.WriteLine("2. TEACHER COURSE ASSIGNMENTS (Teacher -> Course)");
Console.WriteLine("================================================================================");
var assignments = context.TeacherAssignments
    .Include(a => a.Teacher).ThenInclude(t => t.User)
    .Include(a => a.Course)
    .Include(a => a.ClassGroup)
    .ToList();

if (!assignments.Any())
{
    Console.WriteLine("No explicit teacher assignments found in TeacherAssignments table.");
}
else
{
    foreach (var a in assignments)
    {
        Console.WriteLine($"Assignment ID: {a.Id} | Teacher: {a.Teacher?.User?.FirstName} {a.Teacher?.User?.LastName} ({a.Teacher?.TeacherCode}) | Course: {a.Course?.Name} ({a.Course?.Code}) | Group: {a.ClassGroup?.Name ?? "None"}");
    }
}

Console.WriteLine("\n================================================================================");
Console.WriteLine("3. STUDENT ENROLLMENTS (Student -> Course)");
Console.WriteLine("================================================================================");
var enrollments = context.Enrollments
    .Include(e => e.Student).ThenInclude(s => s.User)
    .Include(e => e.Course)
    .Include(e => e.ClassGroup)
    .ToList();

if (!enrollments.Any())
{
    Console.WriteLine("No student enrollments found in Enrollments table.");
}
else
{
    foreach (var e in enrollments)
    {
        Console.WriteLine($"Student: {e.Student?.User?.FirstName} {e.Student?.User?.LastName} ({e.Student?.StudentCode}) | Enrolled Course: {e.Course?.Name} ({e.Course?.Code}) | Status: {(e.IsActive ? "ACTIVE" : "INACTIVE")} | Group: {e.ClassGroup?.Name ?? "None"}");
    }
}

Console.WriteLine("\n================================================================================");
Console.WriteLine("4. COMPLETE RELATIONSHIP: STUDENT -> COURSE -> TEACHER(S)");
Console.WriteLine("================================================================================");
var students = context.Students.Include(s => s.User).ToList();
foreach (var s in students)
{
    Console.WriteLine($"\n🎓 Student: {s.User?.FirstName} {s.User?.LastName} (Email: {s.User?.Email}, Code: {s.StudentCode}, ID: {s.Id})");
    var studentEnrollments = enrollments.Where(e => e.StudentId == s.Id && e.IsActive).ToList();
    
    if (!studentEnrollments.Any())
    {
        Console.WriteLine("   └── [No Active Enrolled Courses]");
    }
    else
    {
        foreach (var se in studentEnrollments)
        {
            var assignedTeachers = assignments.Where(a => a.CourseId == se.CourseId).ToList();
            if (assignedTeachers.Any())
            {
                foreach (var at in assignedTeachers)
                {
                    Console.WriteLine($"   ├── Course: {se.Course?.Name} ({se.Course?.Code}) -> 👨‍🏫 Assigned Teacher: {at.Teacher?.User?.FirstName} {at.Teacher?.User?.LastName} (Email: {at.Teacher?.User?.Email}, Code: {at.Teacher?.TeacherCode})");
                }
            }
            else
            {
                Console.WriteLine($"   ├── Course: {se.Course?.Name} ({se.Course?.Code}) -> 👨‍🏫 Assigned Teacher: (No specific teacher assigned to this course yet)");
            }
        }
    }
}
Console.WriteLine("================================================================================");
