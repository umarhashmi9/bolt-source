# How to Create an Issue

Creating an issue for the GitHub project helps maintain the project's quality and ensures that all relevant information is provided for better resolution. Follow the structure below to create a thorough and specific issue that follows the same principles as our pull request workflow.

---

## 1. **Issue Title**
- The issue title should be concise and follow this structure:
  - **[Type] Short description of the problem** (e.g., `[Bug] Incorrect image rendering on homepage`)
- **Example**: `[Feature] Add dark mode to the app`

## 2. **Issue Description**
In the issue description, you must include all necessary details. Make sure to:
- Provide a **clear explanation** of the issue.
- **Reproduce steps** (if it's a bug or behavior request).
- Include **expected behavior** and **actual behavior** (for bugs).
- Specify **your environment**:
  - **OS**: Windows, Linux, MacOS 
  - **Browser**: Chrome, Firefox, Brave
  - **App Env**: Docker, pnpm, npm
  - **Ollama env**:(optional) Docker, pnpm, npm
  - **Commands**: Commands ran after cloning
- Provide **error messages** (if any), logs, or anything that could assist in diagnosing the problem.

### Example:
```
**Issue Title**: [Bug] Image Upload Crashes App on Profile Page

**Describe the bug**: When trying to upload an image to the profile page, the app crashes.  
**Steps to Reproduce**:
1. Go to the Profile page.
2. Click on "Upload Image."
3. Choose an image and click "Submit."
4. App crashes immediately.

**Link to the Bolt URL that caused the error**: The url in the address bar.

**Steps to reproduce**: Describe the steps we have to take to reproduce the behavior.

**Expected Behavior**: The image should upload without crashing the app.  

**Screen Recording / Screenshot:**

**Platform**:
- **OS**: Windows, Linux, MacOS
- **Browser**: Chrome, Firefox, Brave
- **App Env**: Docker, pnpm, npm
- **Ollama env**:(optional) Docker, pnpm, npm
- **Commands**: Commands ran after cloning

**Additional context**:
Logs: Last couple lines 
Error: "Unhandled Exception: InvalidImageFormatException"  
```

## 3. **Screen Recording / Screenshot**
Provide **screenshots** or a **video** to clearly demonstrate the issue or the expected behavior. This helps contributors quickly understand what’s wrong.

- **Screenshots**: Ensure that the screenshots are clear and show relevant sections of the screen.
- **Video**: If the issue is difficult to capture in screenshots (e.g., UI interaction bugs), provide a short video showing the steps and the issue.

### Example:
- **Screenshots**: Attach the images right inside the issue.
- **Video**: Upload a screen recording right inside the issue.

## 4. **Additional Information**
Provide any other information that could help contributors or maintainers address the issue faster, such as:
- Other related issues.
- Potential solutions (if you have any idea about how to fix the problem).
- Steps you've already tried to resolve the issue (e.g., clearing cache, updating the app).

---

By following this structure, you'll ensure that your issue is well-organized, informative, and easy to act upon, which will help both maintainers and contributors address it quickly and efficiently.
