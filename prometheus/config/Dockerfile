# syntax=docker/dockerfile:1.7

FROM prom/prometheus:latest

COPY config/prometheus.yml /etc/prometheus/prometheus.yml

EXPOSE 9090

# Match the base image's defaults but make them explicit.
CMD ["--config.file=/etc/prometheus/prometheus.yml", \
     "--storage.tsdb.path=/prometheus", \
     "--web.console.libraries=/usr/share/prometheus/console_libraries", \
     "--web.console.templates=/usr/share/prometheus/consoles"]