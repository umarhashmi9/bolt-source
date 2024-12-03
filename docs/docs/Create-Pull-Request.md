# How to Create a Pull Request

Creating a high-quality pull request (PR) for the GitHub project ensures your contributions are clear, organized, and easy to review. Follow this guide to craft an effective and specific pull request.

---

## 1. **Understand the PR Guidelines**
- **One PR, One Change**: Each PR should focus on **a single specific change** (e.g., fixing a bug, adding a feature, updating documentation).
- **Semantic Titles**: Use a title that follows the project’s semantic rules:
  - **Type**: Use one of the allowed types: `fix`, `feat`, `chore`, `build`, `ci`, `perf`, `docs`, `refactor`, `revert`, or `test`.
  - **Lowercase Start**: The subject must not start with an uppercase character.

  Example:  
  - ✅ `fix: correct typo in README`  
  - ❌ `Fix: Correct Typo in README`

---

## 2. **Prepare Your Changes**
- Ensure your work is complete and properly tested.
- Write descriptive and clear commit messages.
- Include unit tests or documentation updates as needed.

---

## 3. **Create the Pull Request**
### Step 1: Fork and Clone the Repository
1. **Fork** the `coleam00/bolt.new-any-llm` repository to your GitHub account.
2. **Clone** the forked repository:
   ```bash
   git clone https://github.com/<your-username>/bolt.new-any-llm.git
   cd bolt.new-any-llm
   ```

### Step 2: Create a Feature Branch
1. Create a new branch for your change:
   ```bash
   git checkout -b <feature-branch-name>
   ```
   Replace `<feature-branch-name>` with a descriptive branch name.

### Step 3: Make Your Changes
- Implement your changes and commit them:
  ```bash
  git add .
  git commit -m "<type>: <short description>"
  ```

---

## 4. **Submit Your Pull Request**
1. Push your branch to your fork:
   ```bash
   git push origin <feature-branch-name>
   ```
2. Go to the original repository `coleam00/bolt.new-any-llm` on GitHub.
3. Click **New Pull Request** and select your branch.

---

## 5. **Write a Good Pull Request Description**
### Include:
- **Title**: Follow the semantic PR rules.
- **Description**: Explain your changes clearly. Use the following structure:
  1. **What**: Describe what the PR does.
  2. **Why**: Explain the purpose or motivation.
  3. **How**: Provide a summary of how you implemented the change.
  4. **Testing**: Mention how you tested the changes.

### Example:
#### Title:
`fix: handle null values in API response`

#### Description:
- **What**: Fixes a bug where null values in the API response caused a crash.  
- **Why**: Ensures the application handles null values gracefully.  
- **How**: Added a null check in the response parser.  
- **Testing**: Added unit tests for edge cases with null values.

---

## 6. **Attach Visuals (Optional but Recommended)**
- **Screenshots**: Include images to show UI changes or errors resolved.
- **Videos**: Demonstrate functionality improvements or bug fixes.

### Example:
- Before Fix:  
  *(Include screenshot or video here)*  
- After Fix:  
  *(Include screenshot or video here)*  

---

## 7. **Respond to Feedback**
- Review comments will be provided by the maintainers.
- Make updates to your PR as needed:
  ```bash
  git add .
  git commit --amend --no-edit
  git push --force
  ```

---

## 8. **Validation with Semantic Action**
The repository uses the **Semantic Pull Request** GitHub Action. If your PR title doesn't follow the rules, it will fail the validation, and you’ll see an error message like:

```
The subject "{subject}" found in the pull request title "{title}" didn't match the configured pattern.
Please ensure that the subject doesn't start with an uppercase character.
```

---

Following these steps ensures your contributions align with the project’s standards and are easy to review. Happy coding!
