# QR attendance camera check

Run the database-independent backend checks with:

    dotnet run --project backend/BrightTutor.LivenessChecks

Frontend checks (from `frontend/brighttutor-client`):

    npm test -- --watch=false --include=src/app/services/liveness-check.spec.ts --include=src/app/features/qr-attendance/qr-attendance.component.spec.ts

## Behavior

- Staff generate a classroom QR valid for five minutes. Refreshing invalidates its previous token and outstanding checks. QR images are rendered locally.
- Opening another QR page reuses the active classroom token. Explicit Refresh rotates it. Staff scanners recover an expired or restarted session once using the selected class; student scanners must obtain the classroom token from their teacher.
- A student checks in only for their own account and active class enrollment. Administrators and currently assigned teachers can supervise check-in. Face enrollment requires an administrator.
- The server issues a left-and-right head-turn sequence, in random order, valid for up to 60 seconds. Each challenge is bound to the signed-in actor, student, class, and QR token. Submission consumes it atomically, including failed evidence submissions.
- The browser uses the existing face-api 68-landmark model. It requires exactly one face, checks every sampled descriptor against the enrolled reference and initial face, and guides neutral/action/return phases. Model errors, missing faces, changed selections, stopped cameras, tracking gaps and expiry invalidate the attempt.
- The server independently validates the ordered observations, timing and descriptor distances. Client `FaceVerified` and confidence fields cannot bypass it. Attendance notes identify the challenge and actor. There is no automatic enrollment at check-in.
- Manual group attendance remains available to administrators and currently assigned teachers, without a camera bypass in the student flow.

## Deployment and limitations

This is a free interactive motion check, **not certified presentation-attack detection**. Measurements and descriptors originate in the browser. A modified client, injected/virtual camera, or sophisticated replay can forge them; server validation does not establish their camera provenance. Face similarity is a heuristic distance, not a calibrated identity probability. Stronger adversarial protection requires independently verified media and a tested anti-spoofing model/service.

State is process-local. Restarting the API invalidates QR sessions and pending challenges. Multi-instance deployments need a shared expiring store with atomic consume semantics before enabling this flow across instances. No schema migration is needed.

Real-camera acceptance still needs testing on target phones: face centered, follow both prompts and return to center; also try no camera permission, two faces, leaving the frame, a still photo and an expired/rotated token. Check lighting, glasses, low-end device performance and accessible manual attendance. Head turns use relative nose displacement; they are not clinical or universal movement thresholds. Use HTTPS for deployed camera access.

No real attendance records or face enrollment were created by these automated checks.
