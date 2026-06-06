create schema if not exists gralex_db;

CREATE TABLE IF NOT EXISTS gralex_db.health_check (
  id          SERIAL PRIMARY KEY,
  checked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note        TEXT
);

INSERT INTO gralex_db.health_check (note) VALUES ('initial bootstrap');

CREATE TYPE "payment_method" AS ENUM (
  'Credito',
  'Prepago'
);

CREATE TYPE "status" AS ENUM (
  'Activa',
  'Cancelada'
);

CREATE TYPE "role" AS ENUM (
  'Administrador',
  'Empleado'
);

CREATE TYPE "action" AS ENUM (
  'Agregó',
  'Editó',
  'Eliminó'
);

CREATE TABLE "Users" (
  "user_id" serial PRIMARY KEY,
  "name" varchar(40),
  "email" varchar(50),
  "password" text,
  "role" role
);

CREATE TABLE "Suppliers" (
  "supplier_id" serial PRIMARY KEY,
  "name" varchar(40),
  "payment_method" payment_method,
  "credit_amount" numeric(8,2),
  "rfc" varchar(13),
  "phone" varchar(10),
  "email" varchar(50)
);

CREATE TABLE "Customers" (
  "customer_id" serial PRIMARY KEY,
  "name" varchar(50),
  "company_name" varchar(50),
  "constancy_situation" text,
  "cp" varchar(5),
  "rfc" varchar(13),
  "phone" varchar(10),
  "email" varchar(50),
  "cfdi" varchar(4)
);

CREATE TABLE "Shipments" (
  "shipment_id" serial PRIMARY KEY,
  "supplier_id" integer,
  "customer_id" integer,
  "tracking_num" varchar(40),
  "sender_name" varchar(30),
  "receiver_name" varchar(30),
  "sender_cp" varchar(5),
  "receiver_cp" varchar(5),
  "weight" varchar(7),
  "service" varchar(30),
  "creation_date" date,
  "status" status,
  "url" text
);

CREATE TABLE "Records" (
  "record_id" serial PRIMARY KEY,
  "user_id" integer,
  "action" action,
  "table_name" varchar(50),
  "record_ref" integer,
  "old_values" json,
  "new_values" json,
  "date" timestamp
);

ALTER TABLE "Shipments" ADD FOREIGN KEY ("supplier_id") REFERENCES "Suppliers" ("supplier_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Shipments" ADD FOREIGN KEY ("customer_id") REFERENCES "Customers" ("customer_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "Records" ADD FOREIGN KEY ("user_id") REFERENCES "Users" ("user_id") DEFERRABLE INITIALLY IMMEDIATE;
