# Gralex PL Management

Plataforma de Gralex para vender guías de paquetería (DHL, FedEx, Estafeta) a
menor costo. Incluye una **landing page** pública, un **panel administrativo** y
un **microservicio de OCR**, todo orquestado con Docker Compose.

## Stack

| Servicio    | Tecnología                                  | Rol                                     |
| ----------- | ------------------------------------------- | --------------------------------------- |
| frontend    | Angular 22 + Tailwind v4                     | Landing + panel admin                   |
| backend     | Node.js + Express 5 + PostgreSQL (`pg`)      | API REST (JWT), llama a SP/vistas        |
| ocr         | Python + FastAPI + Tesseract/OpenCV          | Lectura OCR de guías (PDF/imagen)        |
| database    | PostgreSQL 16                                | Esquema + **procedimientos y vistas**    |
| minio       | MinIO                                        | Almacenamiento de documentos             |
| prometheus  | Prometheus                                   | Métricas                                 |
| grafana     | Grafana                                      | Tableros de métricas                     |
| nginx       | Nginx                                        | Punto de entrada único + ruteo           |

## Arquitectura de red

Todo entra por **nginx** en un solo puerto (`GRALEX_PORT`):

```
http://localhost:${GRALEX_PORT}/          -> frontend (Angular)
http://localhost:${GRALEX_PORT}/api/...   -> backend (Express)
http://localhost:${GRALEX_PORT}/ocr/...   -> microservicio OCR (acceso directo)
```

El flujo normal de OCR es `frontend → /api/documents/ocr → backend → ocr`.

## Cómo levantarlo

```bash
cp .env.example .env
docker compose up --build
```

Luego abre `http://localhost:8080` (puerto por defecto).

### Credenciales de acceso (seed)

```
Email:    admin@gralex.com
Password: admin123
```

La contraseña se guarda **hasheada con bcrypt** (vía `pgcrypto` en el seed) y se
valida con `bcryptjs` antes de emitir el JWT.

## Cambiar el puerto público

Edita `GRALEX_PORT` en `.env` y vuelve a levantar:

```bash
# .env
GRALEX_PORT=80
```

```bash
docker compose up -d
```

Las herramientas de operación tienen su propio puerto configurable
(`GRAFANA_PORT`, `PROMETHEUS_PORT`, `MINIO_API_PORT`, `MINIO_CONSOLE_PORT`,
`DB_PORT`), pero la app completa se mueve sólo con `GRALEX_PORT`.

## Base de datos: procedimientos y vistas

Toda la lógica de acceso vive en `database/scripts/init.sql`:

- **Vistas**: `vw_dashboard_metrics`, `vw_shipments_detail`, `vw_shipments_by_supplier`,
  `vw_shipments_by_status`, `vw_employees_detail`.
- **Procedimientos** (`sp_*`): CRUD de roles, empleados, proveedores, clientes,
  guías y documentos, además de auth (`sp_user_by_email`) y dashboard.

El backend siempre llama a estos `sp_*` / vistas, nunca SQL crudo disperso.

## API

Documentación Swagger en `http://localhost:${GRALEX_PORT}/api/api-docs`.

Endpoints principales: `/auth/login`, `/employees`, `/roles`, `/suppliers`,
`/customers`, `/shipments`, `/documents` (upload + OCR), `/dashboard/metrics`.

## OCR

El microservicio (`/ocr`) lee el texto de la guía y devuelve `{ raw_text, fields }`.
La extracción de campos estructurados **aún no está implementada**: queda lista
para completarse en `ocr/parser.py` (ver `TODO`). Detalles en `ocr/README.md`.

## Estructura

```
backend/    API Express (config, middlewares, models, controllers, routes)
frontend/   App Angular (gralex-pl)
ocr/        Microservicio FastAPI de OCR
database/   Dockerfile + init.sql (esquema, SP, vistas, seed)
minio/      Dockerfile de MinIO
nginx/      Configuración de ruteo
prometheus/ Configuración de scrape
grafana/    Provisioning de datasources/dashboards
docker-compose.yml
```
