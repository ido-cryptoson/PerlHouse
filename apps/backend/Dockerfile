FROM node:18-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/
COPY google-stt-key.json ./

RUN npx tsc

ENV GOOGLE_APPLICATION_CREDENTIALS=/app/google-stt-key.json

EXPOSE 8080

CMD ["node", "dist/index.js"]
