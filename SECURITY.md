# Security Policy

## Supported Versions

This project is under active development. Security fixes are applied to the default branch (`main`).

## Reporting a Vulnerability

If you believe you found a security vulnerability:

1. **Do not** open a public GitHub issue for sensitive reports.
2. Prefer using **GitHub Private Vulnerability Reporting** (Security tab) if it is enabled for this repository.
3. If private reporting is not available, contact the maintainer by creating a minimal issue **without sensitive details** and request a private channel.

## What to Include

- A clear description of the issue
- Steps to reproduce
- Impact assessment (what an attacker could do)
- Any logs/screenshots that help (avoid secrets)

## Scope Notes

- Client-side apps cannot keep secrets. Do not put secrets in `EXPO_PUBLIC_*` env vars.
- Firestore Security Rules are the primary control for data access.
