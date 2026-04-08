# Hajime: Vite frontend + Express API with PostgreSQL (single process on Fly Machines).
# Build: docker build --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... -t hajime .
# Fly:  fly deploy --build-arg VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

FROM node:20-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=${VITE_STRIPE_PUBLISHABLE_KEY}
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Install PostgreSQL client for migrations
RUN apk add --no-cache postgresql-client

# Copy and install server dependencies
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev

# Copy built frontend and server code
COPY --from=frontend /app/dist ./dist
COPY server ./server
COPY src/data ./src/data

EXPOSE 8080

# Run the new production server
CMD ["node", "server/index.mjs"]
