using BrightTutor.Api.Services;

int passed = 0;
void Check(bool condition, string name) { if (!condition) throw new Exception(name); passed++; Console.WriteLine($"PASS {name}"); }
var clock = new TestClock();
var store = new AttendanceChallengeStore(clock);
var actor = Guid.NewGuid(); var student = Guid.NewGuid(); var group = Guid.NewGuid();
var session = store.CreateSession(group);
Check(store.CreateSession(group).Nonce == session.Nonce, "opening another projector reuses the active QR");
Check(store.Issue(actor, student, group, "invented") == null, "unknown QR rejected");
Check(store.Issue(actor, student, Guid.NewGuid(), session.Nonce) == null, "QR bound to group");
var c = store.Issue(actor, student, group, session.Nonce)!;
Check(c.Actions.Length == 2 && c.Actions.Contains("left") && c.Actions.Contains("right"), "random challenge issued");
Check(store.Consume(c.Id, Guid.NewGuid(), student, group, session.Nonce) == null, "challenge bound to actor");
Check(store.Consume(c.Id, actor, Guid.NewGuid(), group, session.Nonce) == null, "challenge bound to student");
Check(store.Consume(c.Id, actor, student, group, session.Nonce) != null, "first consumption succeeds");
Check(store.Consume(c.Id, actor, student, group, session.Nonce) == null, "replay rejected");
c = store.Issue(actor, student, group, session.Nonce)!;
var newer = store.Issue(actor, student, group, session.Nonce)!;
Check(store.Consume(c.Id, actor, student, group, session.Nonce) == null, "new challenge supersedes previous");
clock.Now += TimeSpan.FromSeconds(61);
Check(store.Consume(newer.Id, actor, student, group, session.Nonce) == null, "expired challenge rejected");
c = store.Issue(actor, student, group, session.Nonce)!;
store.CreateSession(group, refresh: true);
Check(store.Consume(c.Id, actor, student, group, session.Nonce) == null, "QR rotation invalidates outstanding challenge");
clock.Now += TimeSpan.FromMinutes(6);
Check(store.Issue(actor, student, group, session.Nonce) == null, "expired QR rejected");
var reference = Enumerable.Repeat(.01, 128).ToArray();
List<LivenessSample> Trace(string[] actions)
{
    var samples = new List<LivenessSample>(); double at = 0;
    void Frames(double eye, double yaw, int n = 3) { for (int i=0; i<n; i++) samples.Add(new(at += 200, eye, yaw, reference)); }
    Frames(.3, 0);
    foreach (var action in actions) { Frames(.3, action == "left" ? -.25 : action == "right" ? .25 : 0, 2); Frames(.3, 0, 2); }
    Frames(.3, 0, 2);
    return samples;
}
foreach (var actions in new[] { new[] {"right", "left"}, new[] {"left", "right"} })
{
    c = new("id", actor, student, group, "nonce", actions, clock.Now, clock.Now.AddSeconds(60));
    var trace = Trace(actions); var now = clock.Now.AddMilliseconds(trace[^1].At + 100);
    Check(AttendanceLiveness.Validate(c, trace, reference, now, out _), "valid ordered sequence: " + string.Join(',', actions));
    Check(AttendanceLiveness.Validate(c, trace.Select(s => s with { Eye = .1 }).ToList(), reference, now, out _), "head turns do not depend on eye-opening detection");
    Check(!AttendanceLiveness.Validate(c, Trace(actions.Reverse().ToArray()), reference, now, out _), "wrong order rejected");
    Check(!AttendanceLiveness.Validate(c, trace, reference, now.AddSeconds(7), out _), "stale observations rejected");
    Check(!AttendanceLiveness.Validate(c, trace, reference, clock.Now.AddSeconds(61), out _), "expired evidence rejected");
    var swapped = trace.ToList(); swapped[5] = swapped[5] with { Descriptor = Enumerable.Repeat(.4,128).ToArray() };
    Check(!AttendanceLiveness.Validate(c, swapped, reference, now, out _), "face swap rejected");
    var malformed = trace.ToList(); malformed[2] = malformed[2] with { Eye = double.NaN };
    Check(!AttendanceLiveness.Validate(c, malformed, reference, now, out _), "invalid measurements rejected");
    var still = trace.Select(s => s with { Eye = .3, Yaw = 0 }).ToList();
    Check(!AttendanceLiveness.Validate(c, still, reference, now, out _), "motionless photo rejected");
}
Check(AttendanceLiveness.ParseDescriptor("[1,2]") == null, "invalid enrollment descriptor rejected");
Console.WriteLine($"{passed} checks passed.");

sealed class TestClock : TimeProvider
{
    public DateTimeOffset Now = new(2026,9,4,0,0,0,TimeSpan.Zero);
    public override DateTimeOffset GetUtcNow() => Now;
}
