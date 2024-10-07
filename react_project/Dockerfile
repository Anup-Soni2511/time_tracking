# Stage 1: Build the React app
FROM node:20-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (if present) and install dependencies
COPY ./react_project/package*.json ./
RUN npm install

# Copy the rest of the application code
COPY ./react_project ./

# Build the React app
RUN npm run build

# Stage 2: Serve the app with an nginx server
FROM nginx:stable-alpine

# Copy the build output to nginx's default directory
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx server
CMD ["nginx", "-g", "daemon off;"]
