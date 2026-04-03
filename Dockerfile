# Hajime: Vite frontend + Express API (single process on Fly Machines).
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
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci --omit=dev
COPY --from=frontend /app/dist ./dist
COPY server ./server
COPY src/data ./src/data
EXPOSE 8080
CMD ["node", "server/stripe-server.mjs"]
