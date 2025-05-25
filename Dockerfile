FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Generate Prisma Client inside the container
RUN npx prisma generate

# Start the app
CMD ["npm", "run", "dev"]
