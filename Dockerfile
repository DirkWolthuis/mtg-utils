FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx nx run engine-server:build:production

FROM node:22-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist/apps/engine-server ./
EXPOSE 8080
CMD ["node", "main.js"]
