using BrightTutor.Application.Payroll.Queries.GetStudentInvoices;
using BrightTutor.Application.Payroll.Queries.GetTeacherPayroll;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PayrollController : ControllerBase
{
    private readonly IMediator _mediator;

    public PayrollController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("teacher-payouts")]
    public async Task<ActionResult<List<TeacherPayrollDto>>> GetTeacherPayroll(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] Guid? teacherId)
    {
        var result = await _mediator.Send(new GetTeacherPayrollQuery
        {
            StartDate = startDate,
            EndDate = endDate,
            TeacherId = teacherId
        });
        return Ok(result);
    }

    [HttpGet("student-invoices")]
    public async Task<ActionResult<List<StudentInvoiceDto>>> GetStudentInvoices(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate,
        [FromQuery] Guid? studentId)
    {
        var result = await _mediator.Send(new GetStudentInvoicesQuery
        {
            StartDate = startDate,
            EndDate = endDate,
            StudentId = studentId
        });
        return Ok(result);
    }
}
