FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci --include=dev
RUN npm run build
RUN echo "=== Verifying build ===" && ls packages/shared/dist/index.js && ls packages/client/dist/index.html && ls packages/server/dist/index.js
CMD ["npm", "start"]
