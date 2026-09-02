using BrightTutor.Application.Students.Commands.CreateStudent;
using BrightTutor.Application.Students.Queries.GetStudentById;
using BrightTutor.Application.Students.Queries.GetStudentsList;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public StudentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<ActionResult<CreateStudentResponse>> CreateStudent([FromBody] CreateStudentCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetStudentById), new { id = result.StudentId }, result);
    }

    [HttpGet]
    public async Task<ActionResult<List<StudentDto>>> GetStudents([FromQuery] string? gradeLevel)
    {
        var result = await _mediator.Send(new GetStudentsListQuery { GradeLevel = gradeLevel });
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<StudentDto>> GetStudentById(Guid id)
    {
        var result = await _mediator.Send(new GetStudentByIdQuery { StudentId = id });
        if (result == null) return NotFound();
        return Ok(result);
    }

    public class EnrollStudentFaceDto
    {
        public string ProfilePhotoUrl { get; set; } = string.Empty;
        public string FaceDescriptorJson { get; set; } = string.Empty;
    }

    [HttpPost("{id:guid}/enroll-face")]
    public async Task<IActionResult> EnrollStudentFace(Guid id, [FromBody] EnrollStudentFaceDto dto, [FromServices] BrightTutor.Application.Abstractions.Persistence.IApplicationDbContext context)
    {
        var student = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(
            context.Students.Include(s => s.User), 
            s => s.Id == id || s.UserId == id);

        if (student == null) return NotFound(new { message = "Student not found." });

        student.ProfilePhotoUrl = dto.ProfilePhotoUrl;
        student.FaceDescriptorJson = dto.FaceDescriptorJson;
        await context.SaveChangesAsync();

        return Ok(new
        {
            message = $"Biometric Face Profile successfully enrolled for {student.User?.FirstName} {student.User?.LastName}!",
            profilePhotoUrl = student.ProfilePhotoUrl,
            faceDescriptorJson = student.FaceDescriptorJson
        });
    }
}
