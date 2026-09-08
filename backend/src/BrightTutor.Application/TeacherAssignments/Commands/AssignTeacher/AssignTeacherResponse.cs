namespace BrightTutor.Application.TeacherAssignments.Commands.AssignTeacher;

public class AssignTeacherResponse
{
    public Guid Id { get; set; }
    public Guid TeacherId { get; set; }
    public Guid CourseId { get; set; }
    public Guid? ClassGroupId { get; set; }
    public DateTime StartDate { get; set; }
}
