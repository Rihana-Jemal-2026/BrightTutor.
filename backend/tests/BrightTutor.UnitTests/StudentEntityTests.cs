using System;
using BrightTutor.Domain.Entities;
using Xunit;

namespace BrightTutor.UnitTests;

public class StudentEntityTests
{
    [Fact]
    public void Student_Initialization_ShouldSetPropertiesCorrectly()
    {
        var studentId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var student = new Student
        {
            Id = studentId,
            UserId = userId,
            StudentCode = "STU-1001",
            GradeLevel = "Grade 10",
            DateOfBirth = new DateTime(2010, 1, 1)
        };

        Assert.Equal(studentId, student.Id);
        Assert.Equal(userId, student.UserId);
        Assert.Equal("STU-1001", student.StudentCode);
        Assert.Equal("Grade 10", student.GradeLevel);
        Assert.Equal(new DateTime(2010, 1, 1), student.DateOfBirth);
    }
}
