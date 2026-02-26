FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci --include=dev
RUN npm run build
RUN echo "=== Verifying build ===" && ls packages/shared/dist/index.js && ls packages/client/dist/index.html && ls packages/server/dist/index.js
CMD sh -c "\
  echo '=== shared package.json ===' && \
  cat packages/shared/package.json && \
  echo '=== shared dist contents ===' && \
  ls packages/shared/dist/ && \
  echo '=== node_modules/@ito/shared ===' && \
  ls -la node_modules/@ito/shared/ && \
  echo '=== node resolves @ito/shared to ===' && \
  node -e \"console.log(import.meta.resolve('@ito/shared'))\" && \
  echo '=== starting server ===' && \
  npm start"
