using System.Net;
using System.Text.Json;
using FluentValidation;

namespace BrightTutor.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;

    public ExceptionHandlingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ValidationException ex)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            var errors = ex.Errors.Select(e => e.ErrorMessage).ToList();
            var response = new
            {
                statusCode = (int)HttpStatusCode.BadRequest,
                message = "Validation Failed",
                errors = errors,
                timestamp = DateTime.UtcNow
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
        catch (InvalidOperationException ex)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            var response = new
            {
                statusCode = (int)HttpStatusCode.BadRequest,
                message = ex.Message,
                errors = new[] { ex.Message },
                timestamp = DateTime.UtcNow
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
        catch (UnauthorizedAccessException ex)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
            var response = new
            {
                statusCode = (int)HttpStatusCode.Unauthorized,
                message = "Unauthorized Access",
                errors = new[] { ex.Message },
                timestamp = DateTime.UtcNow
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
        catch (Exception ex)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            var response = new
            {
                statusCode = (int)HttpStatusCode.InternalServerError,
                message = "An unexpected error occurred.",
                errors = new[] { ex.Message },
                timestamp = DateTime.UtcNow
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}