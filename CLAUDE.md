# Appointment Booking System - Claude Code Guidelines

This CLAUDE.md file provides instructions for Claude Code when working on the Appointment Booking System project.

## Project Overview

This is a full-stack appointment booking system with:
- **Frontend**: Likely React/Vue/Angular (check frontend/ directory)
- **Backend**: Node.js/Express API (check backend/ and api/ directories)
- **Database**: Check data.md for schema details
- **Deployment**: Configured for Vercel (vercel.json)

## Development Guidelines

When working on this codebase:

1. **Respect existing patterns**: Follow the coding style and architectural patterns already established
2. **API consistency**: When modifying backend endpoints, maintain consistency with existing API design
3. **Frontend components**: Follow the component structure and state management patterns in frontend/
4. **Database changes**: Refer to data.md for schema before making modifications
5. **Testing**: Check TESTING.md for testing guidelines and run tests before submitting changes
6. **Documentation**: Update relevant documentation files when making significant changes

## Common Tasks

- **Backend development**: Work primarily in backend/ and api/ directories
- **Frontend development**: Work in frontend/ directory
- **Database migrations**: Refer to data.md and any migration scripts
- **API testing**: Use existing test suites or create new tests in test/ directories
- **Deployment**: Vercel configuration is in vercel.json

## Code Style

- Follow existing JavaScript/TypeScript conventions in the codebase
- Use meaningful variable and function names
- Add comments for complex logic
- Ensure proper error handling in API endpoints

## Getting Started

1. Review README.md and SETUP_GUIDE.md for setup instructions
2. Check package.json for dependencies and scripts
3. Understand the database schema in data.md
4. Run the development server using npm scripts

## Claude Code Specific Notes

- When asked to implement features, consider both frontend and backend changes
- For bug fixes, check logs and error messages to understand root cause
- When optimizing performance, consider database queries and API response times
- Always maintain backward compatibility for public APIs unless explicitly instructed otherwise