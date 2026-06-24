create schema if not exists gralex_db;

CREATE TABLE IF NOT EXISTS gralex_db.health_check (
    id          SERIAL PRIMARY KEY,
    checked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    note        TEXT
);

INSERT INTO gralex_db.health_check (note) VALUES ('initial bootstrap');

CREATE TYPE "action" AS ENUM (
    'Agregó',
    'Editó',
    'Eliminó'
);

CREATE TYPE "document_type" AS ENUM (
    'Guía',
    'Reporte',
    'Constancia SAT'
);

CREATE TABLE "Shipments_status" (
    "ss_id" serial PRIMARY KEY,
    "ss_name" varchar(30) NOT NULL
);

CREATE TABLE "Roles" (
    "role_id" serial PRIMARY KEY,
    "created_by" int,
    "role_name" varchar(30) NOT NULL,
    "salary" numeric(8,2) NOT NULL,
    "description" varchar(70),
    "status" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE "Employees" (
    "employee_id" serial PRIMARY KEY,
    "created_by" int,
    "role_id" int NOT NULL,
    "name" varchar(30) NOT NULL,
    "rest_days" text[],
    "phone" varchar(10) UNIQUE,
    "email" varchar(254) UNIQUE,
    "status" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE "Users" (
    "user_id" serial PRIMARY KEY,
    "employee_id" int UNIQUE NOT NULL,
    "email" varchar(254) UNIQUE NOT NULL,
    "password" text NOT NULL,
    "status" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE "Minio_documents" (
    "minio_id" serial PRIMARY KEY,
    "document_type" document_type NOT NULL,
    "uploaded_by" int NOT NULL,
    "minio_key" varchar(200) NOT NULL,
    "notes" text,
    "date" date NOT NULL DEFAULT CURRENT_DATE,
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE "Suppliers" (
    "supplier_id" serial PRIMARY KEY,
    "created_by" int NOT NULL,
    "name" varchar(40) NOT NULL,
    "credit_amount" numeric(8,2),
    "rfc" varchar(13),
    "phone" varchar(10),
    "email" varchar(254) UNIQUE,
    "status" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE "Customers" (
    "customer_id" serial PRIMARY KEY,
    "created_by" int NOT NULL,
    "constancy_document_id" int,
    "name" varchar(50) NOT NULL,
    "company_name" varchar(50),
    "cp" varchar(5),
    "rfc" varchar(13),
    "phone" varchar(10) UNIQUE,
    "email" varchar(254) UNIQUE,
    "cfdi" varchar(4),
    "status" boolean DEFAULT true,
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE "Shipments" (
    "shipment_id" serial PRIMARY KEY,
    "ss_id" int NOT NULL,
    "created_by" int NOT NULL,
    "supplier_id" int NOT NULL,
    "customer_id" int NOT NULL,
    "minio_id" int,
    "tracking_num" varchar(40) NOT NULL,
    "sender_name" varchar(30),
    "receiver_name" varchar(30),
    "sender_cp" varchar(5),
    "receiver_cp" varchar(5),
    "weight" varchar(7),
    "service" varchar(30),
    "creation_date" date,
    "cost" numeric(8,2),
    "price" numeric(8,2),
    "created_at" timestamp DEFAULT now()
);

CREATE TABLE "Accounts" (
    "account_id" serial PRIMARY KEY,
    "created_by" int NOT NULL,
    "minio_id" int,
    "start_period" date NOT NULL,
    "end_period" date NOT NULL,
    "owner_id" int NOT NULL,
    "owner_type" varchar(8) NOT NULL,
    "total_amount" numeric(10,2),
    "created_at" timestamp DEFAULT now(),
    CONSTRAINT "ck_account_owner_type" CHECK (owner_type IN ('customer', 'supplier'))
);

CREATE TABLE "Records" (
    "record_id" serial PRIMARY KEY,
    "user_id" int NOT NULL,
    "action" action NOT NULL,
    "table_name" varchar(50) NOT NULL,
    "record_ref" int NOT NULL,
    "old_values" json,
    "new_values" json,
    "date" timestamp DEFAULT now()
);

ALTER TABLE "Users" ADD FOREIGN KEY ("employee_id") REFERENCES "Employees" ("employee_id");

ALTER TABLE "Employees" ADD FOREIGN KEY ("created_by") REFERENCES "Users" ("user_id");

ALTER TABLE "Employees" ADD FOREIGN KEY ("role_id") REFERENCES "Roles" ("role_id");

ALTER TABLE "Roles" ADD FOREIGN KEY ("created_by") REFERENCES "Users" ("user_id");

ALTER TABLE "Minio_documents" ADD FOREIGN KEY ("uploaded_by") REFERENCES "Users" ("user_id");

ALTER TABLE "Suppliers" ADD FOREIGN KEY ("created_by") REFERENCES "Users" ("user_id");

ALTER TABLE "Customers" ADD FOREIGN KEY ("created_by") REFERENCES "Users" ("user_id");

ALTER TABLE "Customers" ADD FOREIGN KEY ("constancy_document_id") REFERENCES "Minio_documents" ("minio_id");

ALTER TABLE "Shipments" ADD FOREIGN KEY ("ss_id") REFERENCES "Shipments_status" ("ss_id");

ALTER TABLE "Shipments" ADD FOREIGN KEY ("created_by") REFERENCES "Users" ("user_id");

ALTER TABLE "Shipments" ADD FOREIGN KEY ("supplier_id") REFERENCES "Suppliers" ("supplier_id");

ALTER TABLE "Shipments" ADD FOREIGN KEY ("customer_id") REFERENCES "Customers" ("customer_id");

ALTER TABLE "Shipments" ADD FOREIGN KEY ("minio_id") REFERENCES "Minio_documents" ("minio_id");

ALTER TABLE "Accounts" ADD FOREIGN KEY ("created_by") REFERENCES "Users" ("user_id");

ALTER TABLE "Accounts" ADD FOREIGN KEY ("minio_id") REFERENCES "Minio_documents" ("minio_id");

ALTER TABLE "Records" ADD FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id");

CREATE INDEX "idx_employees_role_id" ON "Employees" ("role_id");
CREATE INDEX "idx_employees_created_by" ON "Employees" ("created_by");
CREATE INDEX "idx_roles_created_by" ON "Roles" ("created_by");
CREATE INDEX "idx_suppliers_created_by" ON "Suppliers" ("created_by");
CREATE INDEX "idx_customers_created_by" ON "Customers" ("created_by");
CREATE INDEX "idx_customers_constancy_doc" ON "Customers" ("constancy_document_id");
CREATE INDEX "idx_shipments_ss_id" ON "Shipments" ("ss_id");
CREATE INDEX "idx_shipments_created_by" ON "Shipments" ("created_by");
CREATE INDEX "idx_shipments_supplier" ON "Shipments" ("supplier_id");
CREATE INDEX "idx_shipments_customer" ON "Shipments" ("customer_id");
CREATE INDEX "idx_shipments_minio" ON "Shipments" ("minio_id");
CREATE INDEX "idx_shipments_date_range" ON "Shipments" ("customer_id", "creation_date");
CREATE INDEX "idx_accounts_created_by" ON "Accounts" ("created_by");
CREATE INDEX "idx_accounts_minio" ON "Accounts" ("minio_id");
CREATE INDEX "idx_records_user_id" ON "Records" ("user_id");
CREATE INDEX "idx_records_date" ON "Records" ("date");
CREATE INDEX "idx_minio_docs_uploaded_by" ON "Minio_documents" ("uploaded_by");
