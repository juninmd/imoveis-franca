```markdown
# Imoveis França

**A standard software project.**

---

## Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/imoveis-franca/imoveis-franca.git
    ```

2.  **Install dependencies:**
    ```bash
    cd imoveis-franca
    npm install
    ```

3.  **Configure ESLint and Jest:**
    ```bash
    npm run lint
    npm run test
    ```

4.  **Run server:**
    ```bash
    npm run server
    ```

---

## Usage

*   **Development:**
    *   Run `npm run lint` to check code style.
    *   Run `npm run test` to run tests.
    *   Run `npm run server` to start the server.
*   **Production:**
    *   Run `npm run server` to deploy to a server.
    *   Run `npm run lint` to ensure code quality is maintained.
*   **Testing:**  The `jest.config.ts` file defines Jest configuration.  The `package-lock.json` ensures consistent code versions. The `client` component demonstrates a basic user interface.  The `src` directory contains the primary codebase.
*   **Configuration:**  The `package.json` file defines project dependencies and scripts.  The `.vscode` directory contains environment-specific settings.  The `__tests__` directory contains test files. The `.eslintignore` file specifies files to ignore.  The `gitignore` file manages untrusted files.
```