# Build stage
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# Run stage
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY vendors ./vendors
RUN mkdir -p data && chown -R node:node /app
USER node
EXPOSE 3000
CMD ["node", "--disable-warning=ExperimentalWarning", "dist/index.js"]
