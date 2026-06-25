# syntax=docker/dockerfile:1.7

FROM minio/minio:latest

# Defaults; overridden by docker-compose environment.
ENV MINIO_ROOT_USER=gralex \
    MINIO_ROOT_PASSWORD=gralex1234

EXPOSE 9000 9001

# 9000 = S3 API, 9001 = web console.
CMD ["server", "/data", "--console-address", ":9001"]