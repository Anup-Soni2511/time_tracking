FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        xvfb \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements file
COPY ./hubstaff/requirements.txt /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt && \
    adduser --disabled-password --no-create-home django-user

# Copy the application code
COPY ./hubstaff /app/

EXPOSE 8000

# Command to run the Django application with Xvfb
CMD ["xvfb-run", "python3", "manage.py", "runserver", "0.0.0.0:8000"]

USER django-user
