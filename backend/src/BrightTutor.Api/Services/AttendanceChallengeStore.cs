using System.Security.Cryptography;
using System.Text.Json;

namespace BrightTutor.Api.Services;

// Process-local, short-lived state. A restart invalidates open QR sessions safely.
public sealed class AttendanceChallengeStore(TimeProvider clock)
{
    public record Session(string Nonce, Guid GroupId, DateTimeOffset ExpiresAt);
    public record Challenge(string Id, Guid ActorId, Guid StudentId, Guid GroupId, string Nonce,
        string[] Actions, DateTimeOffset IssuedAt, DateTimeOffset ExpiresAt);
    private readonly object gate = new();
    private readonly Dictionary<Guid, Session> sessions = new();
    private readonly Dictionary<string, Challenge> challenges = new();
    public Session CreateSession(Guid groupId, bool refresh = false)
    {
        lock (gate)
        {
            Clean();
            if (!refresh && sessions.TryGetValue(groupId, out var existing)) return existing;
            var session = new Session(Token(), groupId, clock.GetUtcNow().AddMinutes(5));
            sessions[groupId] = session;
            return session;
        }
    }
    public Challenge? Issue(Guid actor, Guid student, Guid group, string nonce)
    {
        lock (gate)
        {
            Clean();
            if (!ValidSession(group, nonce) || challenges.Count >= 10000) return null;
            foreach (var item in challenges.Values.Where(c => c.ActorId == actor && c.StudentId == student).ToArray())
                challenges.Remove(item.Id);
            var actions = new[] { "left", "right" };
            if (RandomNumberGenerator.GetInt32(2) == 0) Array.Reverse(actions);
            var now = clock.GetUtcNow();
            var challenge = new Challenge(Token(), actor, student, group, nonce, actions, now,
                new[] { now.AddSeconds(60), sessions[group].ExpiresAt }.Min());
            challenges.Add(challenge.Id, challenge);
            return challenge;
        }
    }
    public Challenge? Consume(string id, Guid actor, Guid student, Guid group, string nonce)
    {
        lock (gate)
        {
            Clean();
            if (!challenges.TryGetValue(id, out var c) || c.ActorId != actor || c.StudentId != student ||
                c.GroupId != group || c.Nonce != nonce || !ValidSession(group, nonce)) return null;
            challenges.Remove(id); // Both successful and failed evidence consumes the attempt.
            return c;
        }
    }
    private bool ValidSession(Guid group, string nonce) => sessions.TryGetValue(group, out var s) &&
        s.Nonce == nonce && s.ExpiresAt > clock.GetUtcNow();
    private void Clean()
    {
        var now = clock.GetUtcNow();
        foreach (var c in challenges.Values.Where(c => c.ExpiresAt <= now).ToArray()) challenges.Remove(c.Id);
        foreach (var s in sessions.Values.Where(s => s.ExpiresAt <= now).ToArray()) sessions.Remove(s.GroupId);
    }
    private static string Token() => Convert.ToHexString(RandomNumberGenerator.GetBytes(16)).ToLowerInvariant();
}

public record LivenessSample(double At, double Eye, double Yaw, double[] Descriptor);

public static class AttendanceLiveness
{
    public static double[]? ParseDescriptor(string? json)
    {
        try { var d = JsonSerializer.Deserialize<double[]>(json ?? "null"); return ValidDescriptor(d) ? d : null; }
        catch (JsonException) { return null; }
    }
    private static bool ValidDescriptor(double[]? d) => d is { Length: 128 } && d.All(x => double.IsFinite(x) && Math.Abs(x) <= 2);
    private static double Distance(double[] a, double[] b) => Math.Sqrt(a.Zip(b, (x, y) => (x-y)*(x-y)).Sum());

    // These are browser observations, not trusted sensor attestation or certified anti-spoofing.
    public static bool Validate(AttendanceChallengeStore.Challenge c, IReadOnlyList<LivenessSample>? samples,
        double[] reference, DateTimeOffset now, out double similarity)
    {
        similarity = 0;
        if (samples is not { Count: >= 11 and <= 240 } || now >= c.ExpiresAt || !ValidDescriptor(reference)) return false;
        var elapsed = (now - c.IssuedAt).TotalMilliseconds;
        if (samples[^1].At < 1500 || samples[^1].At > elapsed + 1000 || elapsed - samples[^1].At > 5000) return false;
        double previous = -1, baselineYaw = 0, heldSince = 0, distance = 0;
        int phase = 0, action = 0, held = 0;
        foreach (var s in samples)
        {
            if (s == null || !double.IsFinite(s.At) || s.At <= previous || s.At < 0 || s.At - Math.Max(0, previous) > 2500 ||
                !double.IsFinite(s.Eye) || s.Eye < 0 || s.Eye > 1 || !double.IsFinite(s.Yaw) || Math.Abs(s.Yaw) > 2 ||
                !ValidDescriptor(s.Descriptor) || Distance(s.Descriptor, reference) > .5 || Distance(s.Descriptor, samples[0].Descriptor) > .5) return false;
            previous = s.At;
            distance = Distance(s.Descriptor, reference);
            if (phase == 0)
            {
                if (Math.Abs(s.Yaw) > .15) { held = 0; continue; }
                if (held++ == 0) heldSince = s.At;
                if (held >= 3 && s.At - heldSince >= 300)
                { baselineYaw = s.Yaw; phase = 1; held = 0; }
                continue;
            }
            var neutral = Math.Abs(s.Yaw - baselineYaw) < .08;
            if (action >= c.Actions.Length) { if (!neutral) return false; continue; }
            var achieved = phase == 2 ? neutral : c.Actions[action] switch
            {
                "left" => s.Yaw - baselineYaw < -.16,
                "right" => s.Yaw - baselineYaw > .16,
                _ => false
            };
            if (!achieved) { held = 0; continue; }
            if (held++ == 0) heldSince = s.At;
            if (held >= 2 && s.At - heldSince >= 150)
            { held = 0; if (phase == 1) phase = 2; else { action++; phase = 1; } }
        }
        similarity = Math.Clamp(Math.Round((1 - distance / .8) * 100), 0, 100);
        return action == c.Actions.Length;
    }
}
