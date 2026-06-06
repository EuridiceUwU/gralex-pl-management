# syntax=docker/dockerfile:1.7

FROM nginx:alpine

# Replace the default site with the one in ./config.
RUN rm /etc/nginx/conf.d/default.conf
COPY config/ /etc/nginx/conf.d/

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1