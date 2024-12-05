# Setup Guide

Below is a comprehensive guide to help you set up the project on your machine. This guide covers both **Docker** and **Non-Docker** setups for **Windows**, **Mac**, and **Linux** users.

---

## Prerequisites

Before setting up the project, ensure you have the following tools installed:

### 1. **Git**
You’ll need Git to clone the repository.  
- **Windows**: Download and install Git from [Git Downloads](https://git-scm.com/downloads).
- **Mac/Linux**: Git is usually pre-installed on Mac/Linux. If not, install it via your package manager:
  - **Mac**: `brew install git` (Homebrew required)
  - **Linux**: `sudo apt install git` (for Ubuntu/Debian)

### 2. **Node.js**
This project requires Node.js.
- **Windows/Mac/Linux**: Download and install Node.js from [Node.js Downloads](https://nodejs.org/en/download/).

  **Important:** After installation, verify that Node.js is correctly added to your system’s PATH.

  - **Windows**: After installing, search for "Environment Variables" in the Start menu, select "Edit the system environment variables," and then check that `C:\Program Files\nodejs\` is included in the **Path** under **System Variables**.
  - **Mac/Linux**: You can check if Node.js is in your PATH by running the following command in the terminal:
    ```bash
    echo $PATH
    ```
    You should see something like `/usr/local/bin` in the output, which is where Node.js is installed.

### 3. **Docker (Optional)**  
If you want to use Docker for running the project, you will need to install Docker:
- **Windows**: Download and install Docker Desktop from [Docker Downloads](https://www.docker.com/).
- **Mac/Linux**: Download and install Docker from [Docker Downloads](https://www.docker.com/).

---

## Step 1: Clone the Repository

First, clone the project repository to your local machine.

1. Open **Command Prompt** (Windows) or **Terminal** (Mac/Linux).
2. Run the following command to clone the repository:

   ```bash
   git clone https://github.com/coleam00/bolt.new-any-llm.git
   ```

3. Navigate into the project directory:

   ```bash
   cd bolt.new-any-llm
   ```

---

## Step 2: Setup .env.local File

The `.env.local` file is used to configure API keys and environment settings.

1. Rename `.env.example` to `.env.local`:

   - **Windows** (Command Prompt):
     ```bash
     ren .env.example .env.local
     ```
   - **Mac/Linux**:
     ```bash
     mv .env.example .env.local
     ```

2. Open `.env.local` with a text editor and add your API keys.

   - **GROQ API Key**: [Get your GROQ API Key](https://console.groq.com/keys)
   - **OpenAI API Key**: [Find your OpenAI API Key](https://help.openai.com/en/articles/4936850-where-do-i-find-my-openai-api-key)
   - **Anthropic API Key**: [Get your Anthropic API Key](https://console.anthropic.com/settings/keys)

   Example configuration:
   ```
   GROQ_API_KEY=XXX
   OPENAI_API_KEY=XXX
   ANTHROPIC_API_KEY=XXX
   ```

3. Optionally, you can set the log level and Ollama settings (if applicable):
   ```
   VITE_LOG_LEVEL=debug
   OLLAMA_API_BASE_URL=http://localhost:11434
   DEFAULT_NUM_CTX=8192
   ```

**Important:** Never commit your `.env.local` file to version control, as it contains sensitive information.

---

## Step 3: Running the Project

### Option 1: Using Docker (Cross-platform)

Docker allows you to run the project in a containerized environment, making it easier to manage dependencies and avoid conflicts.

#### a. Build the Docker Image

Use one of the following commands to build the Docker image:

- **Development Build**:
  ```bash
  npm run dockerbuild
  ```

- **Production Build**:
  ```bash
  npm run dockerbuild:prod
  ```

Alternatively, you can build the image using Docker commands directly:

- **Development Build**:
  ```bash
  docker build . --target bolt-ai-development
  ```

- **Production Build**:
  ```bash
  docker build . --target bolt-ai-production
  ```

#### b. Running with Docker Compose

You can use Docker Compose to manage different environments. Use the following commands:

- **Development Environment**:
  ```bash
  docker-compose --profile development up
  ```

- **Production Environment**:
  ```bash
  docker-compose --profile production up
  ```

When running with the **development** profile, any changes made to the code locally will automatically be reflected in the Docker container (hot-reloading is enabled).

---

### Option 2: Running Without Docker (Native Setup)

If you prefer not to use Docker, you can run the project directly on your machine by installing the necessary dependencies.

#### a. Install Dependencies with pnpm

First, ensure that **pnpm** is installed globally. If it's not installed, you can install it with:

```bash
sudo npm install -g pnpm
```

Then, install the project dependencies:

```bash
pnpm install
```

#### b. Start the Application

Once the dependencies are installed, run the application with:

```bash
pnpm run dev
```

---

## Troubleshooting

1. **Cannot see the `.env.example` file**:  
   - **Windows**: Open File Explorer and enable viewing hidden files in the **View** tab.
   - **Mac**: Run the following command in the terminal to show hidden files:
     ```bash
     defaults write com.apple.finder AppleShowAllFiles YES
     ```

2. **pnpm installation issues**:  
   If you encounter an error such as `command not found: pnpm`, install it globally with:
   ```bash
   sudo npm install -g pnpm
   ```

3. **Docker issues**:  
   - Ensure Docker Desktop is running on **Windows** or **Mac**.
   - If Docker is not starting, try restarting Docker or your computer.

---

## Conclusion

Congratulations! You’ve successfully set up the project on your machine. Whether you’ve used Docker or opted for the native setup, your development environment should be ready to go. If you encounter issues during the setup process, feel free to open an issue on GitHub, or submit a pull request to improve the documentation.

Good luck with your development!
