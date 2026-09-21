FROM node:22-slim


WORKDIR /app


# Install dependencies
COPY package*.json ./
RUN npm ci


# Copy the application
COPY . .


# Build frontend + Node backend
RUN npm run build


# Create runtime directory for persisted runtime files
RUN mkdir -p runtime


EXPOSE 3000


CMD ["npm", "start"]

