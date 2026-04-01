# Security Policy

## Supported Versions

Only the latest version on the default branch is currently supported with security updates.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public issue**
2. Email: **security@cloudpany.eu**
3. Include: description, steps to reproduce, potential impact
4. You will receive a response within 48 hours

## Security Measures

This project implements:
- Dependency lockfiles with integrity hashes
- `ignore-scripts=true` in `.npmrc` to block malicious postinstall hooks
- Automated vulnerability scanning via Dependabot
- Branch protection on default branches
