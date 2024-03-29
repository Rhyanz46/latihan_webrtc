# Use the official Python base image
FROM node:18.17

# Set the working directory in the container
WORKDIR /app

COPY package.json .

# Install the Python dependencies
RUN npm install -g node-pre-gyp
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose the port on which the FastAPI service will run
EXPOSE 5000

# Start the FastAPI service
CMD ["npm", "run", "dev"]
