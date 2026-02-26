FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci --include=dev
RUN npm run build
CMD ["npm", "start"]
