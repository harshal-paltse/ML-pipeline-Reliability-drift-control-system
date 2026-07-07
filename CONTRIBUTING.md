# Contributing to ML Pipeline Reliability & Drift Control System

Thank you for considering contributing! This document outlines the process for contributing to this project.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Branching Strategy](#branching-strategy)
- [Commit Convention](#commit-convention)
- [Code Style](#code-style)
- [Pull Request Process](#pull-request-process)

---

## Getting Started

1. Fork the repository and clone your fork.
2. Create a new branch from `main` for your changes.
3. Make your changes, test them, and open a pull request.

---

## Development Setup

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env    # Fill in your values
uvicorn main:app --reload --port 8001
```

### Frontend
```bash
cd frontend
npm install
cp ../.env.example .env
npm start
```

---

## Branching Strategy

| Branch pattern       | Purpose                          |
|----------------------|----------------------------------|
| `main`               | Stable production-ready code     |
| `feature/<name>`     | New features                     |
| `fix/<name>`         | Bug fixes                        |
| `chore/<name>`       | Dependency updates, refactors    |
| `docs/<name>`        | Documentation only               |

---

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
```

**Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`

**Examples:**
```
feat(api): add pagination to inference logs endpoint
fix(monitoring): replace hardcoded column names with dynamic detection
docs: update README with Docker setup instructions
```

---

## Code Style

### Python (Backend)
- Follow [PEP 8](https://peps.python.org/pep-0008/)
- Use type hints on all function signatures
- Add docstrings to all public functions and classes
- Run `ruff check .` before committing

### JavaScript/TypeScript (Frontend)
- Use functional components with hooks
- Define prop types for all components
- Run `npm run lint` before committing

---

## Pull Request Process

1. Ensure your branch is up-to-date with `main`.
2. All checks must pass (lint, tests).
3. Include a clear description of what changed and why.
4. Reference any related issues with `Closes #<issue-number>`.
5. Request a review from at least one maintainer.

---

## Reporting Issues

Please use [GitHub Issues](../../issues) and include:
- A clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Python version, Node version)
