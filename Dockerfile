FROM python:3.11-slim

WORKDIR /app

# Copy project files
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV LANGFLOW_MCP_PORT=7860

# Expose port
EXPOSE 7860

# Command to run the application
CMD ["python", "app.py"]