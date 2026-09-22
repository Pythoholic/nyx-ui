# Security Policy

## Supported versions

Nyx UI is currently preparing its beta release. The `0.2.x` beta line is the only
supported release line.

| Version | Supported |
| --- | --- |
| 0.2.x beta | Yes |
| Earlier versions | No |

Beta status means APIs and security support may change, and there is no long-term
support commitment yet. Upgrade to the latest `0.2.x` beta before reporting an
issue when practical.

## Reporting a vulnerability

**Do not open a public GitHub issue for a suspected vulnerability.**

Report vulnerabilities privately through
[GitHub Security Advisories](https://github.com/Pythoholic/nyx-ui/security/advisories/new).
If that private reporting path is unavailable, email `boxitupsam@gmail.com` with
the subject `Nyx UI security report`.

Include the affected package and version, impact, reproduction steps or a minimal
reproduction, and any suggested mitigation. Please avoid including secrets or
unnecessary personal data.

Nyx UI is a single-maintainer project. The maintainer aims to:

- acknowledge a report within 7 days; and
- assess it and respond with next steps within 30 days.

These are response targets rather than guaranteed resolution times. Complex issues
may take longer to fix and coordinate. Please keep the report private until a fix
or coordinated disclosure plan is available.

## Scope

Nyx UI is a client-side UI framework. Vulnerabilities in Nyx-owned source,
published packages, registry markup, or controllers are in scope. This includes a
sanitization or escaping failure inside code owned and executed by Nyx UI.

Adopters remain responsible for their application validation, authentication,
authorization, server-side behavior, and trust boundaries. Cross-site scripting
caused by an application supplying unescaped or untrusted content to a documented
raw-content surface is generally the adopter's responsibility. Reports showing
that Nyx UI itself bypasses, breaks, or incorrectly claims sanitization or escaping
are in scope.
