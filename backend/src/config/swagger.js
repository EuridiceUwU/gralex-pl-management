import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Gralex Management API",
      version: "0.1.0",
      description:
        "API documentation for the Gralex Management backend. El microservicio OCR (FastAPI) tiene su propia documentación en /ocr/docs.",
    },
    servers: [
      {
        url: "/api",
        description: "Via nginx (docker compose)",
      },
      {
        url: "http://localhost:3000",
        description: "Backend directo (sin nginx)",
      },
    ],
    tags: [
      { name: "Auth", description: "Autenticación y sesión" },
      { name: "Employees", description: "Gestión de empleados y usuarios" },
      { name: "Roles", description: "Gestión de roles / puestos" },
      { name: "Customers", description: "Gestión de clientes" },
      { name: "Suppliers", description: "Gestión de proveedores (paqueterías)" },
      { name: "Shipments", description: "Gestión de guías / envíos" },
      { name: "Documents", description: "Subida de guías a MinIO y lectura por OCR" },
      { name: "Dashboard", description: "Métricas y gráficas del panel" },
      { name: "Health", description: "System health check" },
      { name: "Metrics", description: "System metrics" },
      { name: "Database", description: "Database health and operations" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Customer: {
          type: "object",
          properties: {
            customer_id: { type: "integer", example: 1 },
            name: { type: "string", example: "María López" },
            company_name: { type: "string", example: "Comercializadora MX" },
            cp: { type: "string", example: "94500" },
            rfc: { type: "string", example: "LOMA900101AAA" },
            phone: { type: "string", example: "2299887766" },
            email: { type: "string", example: "maria@empresa.com" },
            cfdi: { type: "string", example: "G03" },
            active: { type: "boolean", example: true },
          },
        },
        Supplier: {
          type: "object",
          properties: {
            supplier_id: { type: "integer", example: 1 },
            name: { type: "string", example: "DHL" },
            credit_amount: { type: "number", example: 50000 },
            rfc: { type: "string", example: "DHL010101AAA" },
            phone: { type: "string", example: "5500000000" },
            email: { type: "string", example: "contacto@dhl.com" },
            active: { type: "boolean", example: true },
          },
        },
        Employee: {
          type: "object",
          properties: {
            employee_id: { type: "integer", example: 1 },
            role_id: { type: "integer", example: 1 },
            name: { type: "string", example: "Juan Pérez" },
            email: { type: "string", example: "juan.perez@gralex.com" },
            phone: { type: "string", example: "5512345678" },
            rest_days: {
              type: "array",
              items: { type: "string" },
              example: ["Sábado", "Domingo"],
            },
            active: { type: "boolean", example: true },
          },
        },
        Role: {
          type: "object",
          properties: {
            role_id: { type: "integer", example: 1 },
            role_name: { type: "string", example: "Operador" },
            salary: { type: "number", example: 8500.0 },
            description: { type: "string", example: "Captura de guías" },
          },
        },
        Shipment: {
          type: "object",
          properties: {
            shipment_id: { type: "integer", example: 1 },
            ss_id: { type: "integer", example: 1 },
            supplier_id: { type: "integer", example: 1 },
            customer_id: { type: "integer", example: 1 },
            tracking_num: { type: "string", example: "1234567890" },
            sender_name: { type: "string", example: "Gralex" },
            receiver_name: { type: "string", example: "María López" },
            sender_cp: { type: "string", example: "94500" },
            receiver_cp: { type: "string", example: "06000" },
            weight: { type: "string", example: "2.5" },
            carrier: {
              type: "string",
              enum: ["Fedex", "DHL", "Estafeta", "Paquetexpress", "Otro"],
              example: "DHL",
            },
            carrier_other: { type: "string", example: "Paquetería Local SA" },
            service: {
              type: "string",
              enum: ["Express", "Terrestre", "Internacional"],
              example: "Express",
            },
            creation_date: { type: "string", format: "date", example: "2026-06-24" },
            cost: { type: "number", example: 120.5 },
            price: { type: "number", example: 180.0 },
          },
        },
        Document: {
          type: "object",
          properties: {
            document_id: { type: "integer", example: 1 },
            document_type: {
              type: "string",
              enum: ["Guía", "Reporte", "Constancia SAT"],
              example: "Guía",
            },
            minio_key: { type: "string", example: "guía/uuid.pdf" },
            uploaded_by: { type: "integer", nullable: true, example: 1 },
            notes: { type: "string", example: "Documento escaneado" },
          },
        },
        Account: {
          type: "object",
          description: "Estado de cuenta generado (histórico) para un cliente o proveedor",
          properties: {
            account_id: { type: "integer", example: 1 },
            minio_id: { type: "integer", example: 1 },
            owner_id: { type: "integer", example: 1 },
            owner_type: { type: "string", enum: ["customer", "supplier"], example: "customer" },
            start_period: { type: "string", format: "date", example: "2026-06-01" },
            end_period: { type: "string", format: "date", example: "2026-06-30" },
            total_amount: { type: "number", example: 4500.75 },
          },
        },
        OcrFields: {
          type: "object",
          description: "Campos detectados automáticamente a partir del texto OCR (parser.py); vienen null si no se detectan.",
          properties: {
            carrier: {
              type: "string",
              nullable: true,
              enum: ["Fedex", "DHL", "Estafeta", "Paquetexpress", "Otro"],
              example: "DHL",
            },
            tracking_num: { type: "string", nullable: true, example: "1234567890" },
            sender_name: { type: "string", nullable: true, example: "Gralex" },
            receiver_name: { type: "string", nullable: true, example: "María López" },
            sender_cp: { type: "string", nullable: true, example: "94500" },
            receiver_cp: { type: "string", nullable: true, example: "06000" },
            weight: { type: "string", nullable: true, example: "2.5" },
            service: {
              type: "string",
              nullable: true,
              enum: ["Express", "Terrestre"],
              example: "Express",
            },
            creation_date: { type: "string", format: "date", nullable: true, example: "2026-06-24" },
            supplier: { type: "string", nullable: true, example: "DHL" },
            cost: { type: "string", nullable: true, example: null },
          },
        },
        OcrResult: {
          type: "object",
          description: "Respuesta del backend al proxyear el archivo al microservicio OCR (Python/FastAPI) en /ocr/extract.",
          properties: {
            ok: { type: "boolean", example: true },
            filename: { type: "string", example: "guia-dhl.pdf" },
            content_type: { type: "string", example: "application/pdf" },
            raw_text: { type: "string", description: "Texto crudo extraído por Tesseract/OCR" },
            fields: { $ref: "#/components/schemas/OcrFields" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            ok: { type: "boolean", example: false },
            message: { type: "string", example: "Recurso no encontrado" },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
