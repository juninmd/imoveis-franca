```markdown
# AGENTS.md File Guidelines

These guidelines outline the core principles and rules for development of this AGENTS repository.  Adherence to these principles is critical for maintaining a well-structured, maintainable, and robust codebase.

**1. DRY (Don't Repeat Yourself)**

*   All functions, classes, and modules should have single, well-defined purposes.
*   Avoid duplicating logic across multiple files.
*   Refactor code to eliminate redundancies whenever possible.
*   Implement common patterns and reusable components across various areas of the codebase.

**2. KISS (Keep It Simple, Stupid)**

*   Strive for minimal complexity in code.
*   Prioritize readability and understandability.
*   Use clear and concise variable and function names.
*   Avoid unnecessary abstraction.

**3. SOLID Principles**

*   **Single Responsibility Principle:** Each class or module should have one and only one reason to change.
*   **Open/Closed Principle:**  The system should be extensible through mechanisms like interfaces and abstract classes without modifying the existing code.
*   **Liskov Substitution Principle:**  Subclasses should be substitutable for their base classes without altering the correctness of the program.
*   **Interface Segregation Principle:** Clients shouldn’t be forced to wringe instantiation of an interface, opting instead for concrete implementations.
*   **Dependency Inversion Principle:** High-level modules should not depend on low-level modules; they should depend on abstractions.

**4. YAGNI (You Aren't Gonna Need It)**

*   Avoid adding features or functionality that are not currently required.
*   Focus on completing the existing requirements.
*   Don’t introduce premature optimizations or complex solutions.

**5. Code Structure & File Limits**

*   Each file should have a maximum of 180 lines of code.
*   Code should be well-formatted, adhering to standard indentation and whitespace.
*   Use meaningful comments where necessary to explain complex logic or assumptions.
*   Organize code into logical modules and components.
*   Consider using a consistent coding style throughout the repository.
*   Separate concerns: Clearly define input/output, processing, and output sections.

**6. Testing & Coverage**

*   All development must be productive.  Do not use mocks or fake implementations for testing.
*   Unit tests should focus on individual functions and classes.
*   Test coverage must be at least 80% for all files.  Automated test suites are required for all significant functionality.
*   Write tests for all code paths – including edge cases and error conditions.
*   Utilize a testing framework (e.g., pytest, unittest) to build and run tests.

**7.  Specific File Considerations**

*   **Configuration Module:**  Clearly define configuration parameters and their relationships.  Maintain a separate configuration file for each project/environment.
*   **Data Abstraction Module:**  Implement abstraction layers to decouple data access from implementation details.
*   **API Module:**  Define clear APIs for external interactions.
*   **Logging Module:**  Implement robust logging for debugging and monitoring.
*   **Error Handling Module:**  Design a consistent and informative error handling strategy.

**8.  Code Standards & Style**

*   Use a consistent naming convention for variables, functions, and classes.
*   Follow a standard code formatting style (e.g., black fork).
*   Document code clearly using docstrings.

**9.  Maintainability**

*   Document all assumptions and dependencies.
*   Use meaningful names.
*   Write clear and concise code.
*   Design for future modifications.

**10.  Deliverables & Review**

*   Regular code reviews are required before merging changes into main branches.
*   Automated code analysis (linting) is encouraged.
*   Static analysis tools are required for detecting potential bugs and style issues.

**11. Dependencies & External Libraries**

*   Clearly define and document all external dependencies.
*   Use a dependency management tool (e.g., Poetry, Pipenv) to manage project dependencies.

These guidelines are intended to foster a collaborative and high-quality development environment.  Any deviations from these principles should be carefully considered and justified.
```