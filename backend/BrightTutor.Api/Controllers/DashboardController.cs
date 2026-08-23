using BrightTutor.Application.Dashboard.Queries.GetAdminDashboardSummary;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BrightTutor.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;

    public DashboardController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<AdminDashboardSummaryDto>> GetSummary()
    {
        var result = await _mediator.Send(new GetAdminDashboardSummaryQuery());
        return Ok(result);
    }
}
