using System;
using BrightTutor.Api;
using Xunit;

namespace BrightTutor.IntegrationTests;

public class ApiIntegrationTests
{
    [Fact]
    public void ApiAssembly_ShouldLoadProgramType()
    {
        var programType = typeof(Program);
        Assert.NotNull(programType);
        Assert.Equal("Program", programType.Name);
    }
}
