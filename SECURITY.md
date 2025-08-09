# Security Policy

## Supported Versions

This is a CLI tool and not a hosted service. We aim to keep `main` stable.

## Reporting a Vulnerability

If you discover a security issue, please do not open a public issue. Instead, email the maintainer:

- security contact: 42072991+chrishuman0923@users.noreply.github.com

Please include:

- A description of the issue and potential impact
- Steps to reproduce (if applicable)
- Any relevant logs or screenshots

We will acknowledge receipt within 72 hours and work to resolve the issue promptly.

## Scope

- Secrets must never be committed. Use local `.env` files. The repository includes `.gitignore` rules for `.env*` and `.session/`.
- This project authenticates to the MNO web app for authorized users only. Respect site terms and rate limits.
