
FROM grafana/grafana:latest

# Bake provisioning files into the image so dashboards / datasources are
# created automatically on first boot. Drop new files into ./provisioning/
# to extend.
COPY provisioning/ /etc/grafana/provisioning/

EXPOSE 3000