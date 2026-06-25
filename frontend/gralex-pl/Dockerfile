# syntax=docker/dockerfile:1.7

############################
# Stage 1: build the Angular app
############################
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

############################
# Stage 2: serve static files with nginx
############################
FROM nginx:alpine AS runtime

# Angular's application builder emits to dist/<project>/browser.
COPY --from=build /app/dist/gralex-pl/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
