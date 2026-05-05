FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the Next.js app
# RUN npm run build

# For development, we run the dev server
CMD ["npm", "run", "dev"]
