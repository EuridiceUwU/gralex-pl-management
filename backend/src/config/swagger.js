import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Gralex Management API",
      version: "0.1.0",
      description: "API documentation for the Gralex Management backend",
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
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
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
