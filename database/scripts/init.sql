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
    "supplier_id" int,
    "customer_id" int,
    "minio_id" int,
    "tracking_num" varchar(40) NOT NULL,
    "sender_name" varchar(70),
    "receiver_name" varchar(70),
    "sender_cp" varchar(5),
    "receiver_cp" varchar(5),
    "weight" varchar(7),
    "carrier" varchar(20),
    "carrier_other" varchar(30),
    "service" varchar(30),
    "creation_date" date,
    "cost" numeric(8,2),
    "price" numeric(8,2),
    "created_at" timestamp DEFAULT now(),
    CONSTRAINT "ck_shipment_carrier" CHECK ("carrier" IN ('Fedex', 'DHL', 'Estafeta', 'Paquetexpress', 'Otro')),
    CONSTRAINT "ck_shipment_service" CHECK ("service" IN ('Express', 'Terrestre', 'Internacional'))
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

-- ============================================================================
--  Extensions
-- ============================================================================
-- pgcrypto provides crypt()/gen_salt() so we can store a bcrypt password hash
-- straight from the seed. bcrypt hashes produced here ($2a$) are verifiable by
-- the backend's bcryptjs.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
--  Views  (consumed by the backend for dashboards / detailed listings)
-- ============================================================================
CREATE OR REPLACE VIEW "vw_employees_detail" AS
SELECT e."employee_id",
       e."name",
       e."email",
       e."phone",
       e."rest_days",
       e."status",
       e."created_at",
       e."role_id",
       r."role_name"
FROM "Employees" e
JOIN "Roles" r ON r."role_id" = e."role_id";

CREATE OR REPLACE VIEW "vw_shipments_detail" AS
SELECT s."shipment_id",
       s."tracking_num",
       s."sender_name",
       s."receiver_name",
       s."sender_cp",
       s."receiver_cp",
       s."weight",
       s."carrier",
       s."carrier_other",
       s."service",
       s."creation_date",
       s."cost",
       s."price",
       (COALESCE(s."price", 0) - COALESCE(s."cost", 0)) AS "margin",
       s."created_at",
       s."customer_id",
       c."name"        AS "customer_name",
       s."supplier_id",
       sup."name"      AS "supplier_name",
       s."ss_id",
       st."ss_name"    AS "status_name",
       s."minio_id",
       m."minio_key"
FROM "Shipments" s
LEFT JOIN "Customers" c        ON c."customer_id" = s."customer_id"
LEFT JOIN "Suppliers" sup      ON sup."supplier_id" = s."supplier_id"
JOIN "Shipments_status" st ON st."ss_id" = s."ss_id"
LEFT JOIN "Minio_documents" m ON m."minio_id" = s."minio_id";

CREATE OR REPLACE VIEW "vw_dashboard_metrics" AS
SELECT
    (SELECT COUNT(*) FROM "Shipments")                              AS "total_shipments",
    COALESCE((SELECT SUM("price") FROM "Shipments"), 0)            AS "total_revenue",
    COALESCE((SELECT SUM("cost") FROM "Shipments"), 0)             AS "total_cost",
    COALESCE((SELECT SUM("price" - "cost") FROM "Shipments"), 0)   AS "total_margin",
    (SELECT COUNT(*) FROM "Customers" WHERE "status")              AS "total_customers",
    (SELECT COUNT(*) FROM "Suppliers" WHERE "status")              AS "total_suppliers",
    (SELECT COUNT(*) FROM "Employees" WHERE "status")              AS "total_employees";

CREATE OR REPLACE VIEW "vw_suppliers_with_balance" AS
SELECT s."supplier_id",
       s."created_by",
       s."name",
       s."credit_amount",
       s."rfc",
       s."phone",
       s."email",
       s."status",
       s."created_at",
       COALESCE(SUM(sh."cost") FILTER (WHERE st."ss_name" IS DISTINCT FROM 'Cancelado'), 0) AS "total_consumed",
       CASE
         WHEN s."credit_amount" IS NULL THEN NULL
         ELSE (s."credit_amount" - COALESCE(SUM(sh."cost") FILTER (WHERE st."ss_name" IS DISTINCT FROM 'Cancelado'), 0))
       END AS "available_balance"
FROM "Suppliers" s
LEFT JOIN "Shipments" sh ON sh."supplier_id" = s."supplier_id"
LEFT JOIN "Shipments_status" st ON st."ss_id" = sh."ss_id"
GROUP BY s."supplier_id";

CREATE OR REPLACE VIEW "vw_shipments_by_supplier" AS
SELECT sup."supplier_id",
       sup."name" AS "supplier_name",
       COUNT(s."shipment_id")                  AS "total",
       COALESCE(SUM(s."price"), 0)             AS "revenue"
FROM "Suppliers" sup
LEFT JOIN "Shipments" s ON s."supplier_id" = sup."supplier_id"
GROUP BY sup."supplier_id", sup."name"
ORDER BY sup."supplier_id";

CREATE OR REPLACE VIEW "vw_shipments_by_status" AS
SELECT st."ss_id",
       st."ss_name",
       COUNT(s."shipment_id") AS "total"
FROM "Shipments_status" st
LEFT JOIN "Shipments" s ON s."ss_id" = st."ss_id"
GROUP BY st."ss_id", st."ss_name"
ORDER BY st."ss_id";

CREATE OR REPLACE VIEW "vw_users_detail" AS
SELECT u."user_id",
       u."employee_id",
       u."email",
       u."password",
       u."status",
       u."created_at",
       e."name",
       r."role_id",
       r."role_name"
FROM "Users" u
JOIN "Employees" e ON e."employee_id" = u."employee_id"
JOIN "Roles" r     ON r."role_id" = e."role_id";

-- ============================================================================
--  Audit trigger. Every sp_*_create/update/delete procedure below sets the
--  acting user with set_config('app.current_user_id', ..., true) right before
--  its INSERT/UPDATE; this trigger reads that session-local value and writes
--  the "Records" row automatically, so no procedure body has to do it by hand.
--  If no actor is set (e.g. the bootstrap seed below, which runs raw INSERTs)
--  nothing is logged — "Records"."user_id" stays NOT NULL and trustworthy.
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_audit_log() RETURNS trigger AS $$
DECLARE
    v_user_id    int;
    v_action     action;
    v_pk_column  text := TG_ARGV[0];
    v_record_ref int;
BEGIN
    v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::int;

    IF v_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        v_record_ref := (to_jsonb(NEW) ->> v_pk_column)::int;
        INSERT INTO "Records" ("user_id", "action", "table_name", "record_ref", "old_values", "new_values")
        VALUES (v_user_id, 'Agregó', TG_TABLE_NAME, v_record_ref, NULL, (to_jsonb(NEW) - 'password')::json);
    ELSIF TG_OP = 'UPDATE' THEN
        v_record_ref := (to_jsonb(NEW) ->> v_pk_column)::int;
        v_action := CASE
            WHEN (to_jsonb(OLD) ->> 'status') = 'true' AND (to_jsonb(NEW) ->> 'status') = 'false'
                THEN 'Eliminó'::action
            ELSE 'Editó'::action
        END;
        INSERT INTO "Records" ("user_id", "action", "table_name", "record_ref", "old_values", "new_values")
        VALUES (v_user_id, v_action, TG_TABLE_NAME, v_record_ref,
                (to_jsonb(OLD) - 'password')::json, (to_jsonb(NEW) - 'password')::json);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_audit     AFTER INSERT OR UPDATE ON "Users"     FOR EACH ROW EXECUTE FUNCTION fn_audit_log('user_id');
CREATE TRIGGER trg_roles_audit     AFTER INSERT OR UPDATE ON "Roles"     FOR EACH ROW EXECUTE FUNCTION fn_audit_log('role_id');
CREATE TRIGGER trg_employees_audit AFTER INSERT OR UPDATE ON "Employees" FOR EACH ROW EXECUTE FUNCTION fn_audit_log('employee_id');
CREATE TRIGGER trg_suppliers_audit AFTER INSERT OR UPDATE ON "Suppliers" FOR EACH ROW EXECUTE FUNCTION fn_audit_log('supplier_id');
CREATE TRIGGER trg_customers_audit AFTER INSERT OR UPDATE ON "Customers" FOR EACH ROW EXECUTE FUNCTION fn_audit_log('customer_id');
CREATE TRIGGER trg_shipments_audit AFTER INSERT OR UPDATE ON "Shipments" FOR EACH ROW EXECUTE FUNCTION fn_audit_log('shipment_id');
CREATE TRIGGER trg_documents_audit AFTER INSERT ON "Minio_documents"     FOR EACH ROW EXECUTE FUNCTION fn_audit_log('minio_id');

-- ============================================================================
--  Stored procedures. All writes (create/update/delete) go through these real
--  PostgreSQL procedures, invoked with CALL. Reads (list/get) are NOT wrapped
--  in functions: the backend queries the views/tables directly, and reuses
--  those same SELECTs to re-fetch the row after a CALL, since these
--  procedures don't return the row themselves. create procedures have a
--  single OUT new_id so the backend knows which row to re-fetch; update and
--  delete procedures are void (CALL needs zero NULL placeholders for them).
--  update procedures use COALESCE so the backend can send NULL for any field
--  it doesn't want to change (partial update). Each procedure calls
--  set_config(...) with the acting user before writing, which fn_audit_log()
--  picks up to log the change into "Records" automatically.
-- ============================================================================

-- ---- Auth / Users ----------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_user_create(
    p_employee_id int,
    p_email       varchar,
    p_password    text,
    p_created_by  int
)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_created_by::text, true);

    INSERT INTO "Users" ("employee_id", "email", "password")
    VALUES (p_employee_id, p_email, p_password);
END;
$$;

-- ---- Roles -----------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_role_create(
    p_created_by  int,
    p_role_name   varchar,
    p_salary      numeric,
    p_description varchar,
    OUT new_id    int
)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_created_by::text, true);

    INSERT INTO "Roles" ("created_by", "role_name", "salary", "description")
    VALUES (p_created_by, p_role_name, p_salary, p_description)
    RETURNING "role_id" INTO new_id;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_role_update(
    p_id          int,
    p_role_name   varchar,
    p_salary      numeric,
    p_description varchar,
    p_status      boolean,
    p_user_id     int
)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::text, true);

    UPDATE "Roles"
    SET "role_name" = COALESCE(p_role_name, "role_name"),
        "salary" = COALESCE(p_salary, "salary"),
        "description" = COALESCE(p_description, "description"),
        "status" = COALESCE(p_status, "status")
    WHERE "role_id" = p_id;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_role_delete(p_id int, p_user_id int)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::text, true);
    UPDATE "Roles" SET "status" = false WHERE "role_id" = p_id;
END;
$$;

-- ---- Employees -------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_employee_create(
    p_created_by int,
    p_role_id    int,
    p_name       varchar,
    p_rest_days  text[],
    p_phone      varchar,
    p_email      varchar,
    OUT new_id   int
)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_created_by::text, true);

    INSERT INTO "Employees" ("created_by", "role_id", "name", "rest_days", "phone", "email")
    VALUES (p_created_by, p_role_id, p_name, p_rest_days, p_phone, p_email)
    RETURNING "employee_id" INTO new_id;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_employee_update(
    p_id        int,
    p_role_id   int,
    p_name      varchar,
    p_rest_days text[],
    p_phone     varchar,
    p_email     varchar,
    p_status    boolean,
    p_user_id   int
)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::text, true);

    UPDATE "Employees"
    SET "role_id" = COALESCE(p_role_id, "role_id"),
        "name" = COALESCE(p_name, "name"),
        "rest_days" = COALESCE(p_rest_days, "rest_days"),
        "phone" = COALESCE(p_phone, "phone"),
        "email" = COALESCE(p_email, "email"),
        "status" = COALESCE(p_status, "status")
    WHERE "employee_id" = p_id;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_employee_delete(p_id int, p_user_id int)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::text, true);
    UPDATE "Employees" SET "status" = false WHERE "employee_id" = p_id;
END;
$$;

-- ---- Suppliers -------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_supplier_create(
    p_created_by    int,
    p_name          varchar,
    p_credit_amount numeric,
    p_rfc           varchar,
    p_phone         varchar,
    p_email         varchar,
    OUT new_id      int
)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_created_by::text, true);

    INSERT INTO "Suppliers" ("created_by", "name", "credit_amount", "rfc", "phone", "email")
    VALUES (p_created_by, p_name, p_credit_amount, p_rfc, p_phone, p_email)
    RETURNING "supplier_id" INTO new_id;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_supplier_update(
    p_id            int,
    p_name          varchar,
    p_credit_amount numeric,
    p_rfc           varchar,
    p_phone         varchar,
    p_email         varchar,
    p_status        boolean,
    p_user_id       int
)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::text, true);

    UPDATE "Suppliers"
    SET "name" = COALESCE(p_name, "name"),
        "credit_amount" = COALESCE(p_credit_amount, "credit_amount"),
        "rfc" = COALESCE(p_rfc, "rfc"),
        "phone" = COALESCE(p_phone, "phone"),
        "email" = COALESCE(p_email, "email"),
        "status" = COALESCE(p_status, "status")
    WHERE "supplier_id" = p_id;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_supplier_delete(p_id int, p_user_id int)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::text, true);
    UPDATE "Suppliers" SET "status" = false WHERE "supplier_id" = p_id;
END;
$$;

-- ---- Customers -------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_customer_create(
    p_created_by            int,
    p_constancy_document_id int,
    p_name                  varchar,
    p_company_name          varchar,
    p_cp                    varchar,
    p_rfc                   varchar,
    p_phone                 varchar,
    p_email                 varchar,
    p_cfdi                  varchar,
    OUT new_id              int
)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_created_by::text, true);

    INSERT INTO "Customers" ("created_by", "constancy_document_id", "name", "company_name", "cp", "rfc", "phone", "email", "cfdi")
    VALUES (p_created_by, p_constancy_document_id, p_name, p_company_name, p_cp, p_rfc, p_phone, p_email, p_cfdi)
    RETURNING "customer_id" INTO new_id;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_customer_update(
    p_id           int,
    p_name         varchar,
    p_company_name varchar,
    p_cp           varchar,
    p_rfc          varchar,
    p_phone        varchar,
    p_email        varchar,
    p_cfdi         varchar,
    p_status       boolean,
    p_user_id      int
)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::text, true);

    UPDATE "Customers"
    SET "name" = COALESCE(p_name, "name"),
        "company_name" = COALESCE(p_company_name, "company_name"),
        "cp" = COALESCE(p_cp, "cp"),
        "rfc" = COALESCE(p_rfc, "rfc"),
        "phone" = COALESCE(p_phone, "phone"),
        "email" = COALESCE(p_email, "email"),
        "cfdi" = COALESCE(p_cfdi, "cfdi"),
        "status" = COALESCE(p_status, "status")
    WHERE "customer_id" = p_id;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_customer_delete(p_id int, p_user_id int)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::text, true);
    UPDATE "Customers" SET "status" = false WHERE "customer_id" = p_id;
END;
$$;

-- ---- Shipments -------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_shipment_create(
    p_ss_id         int,
    p_created_by    int,
    p_supplier_id   int,
    p_customer_id   int,
    p_minio_id      int,
    p_tracking_num  varchar,
    p_sender_name   varchar,
    p_receiver_name varchar,
    p_sender_cp     varchar,
    p_receiver_cp   varchar,
    p_weight        varchar,
    p_service       varchar,
    p_creation_date date,
    p_cost          numeric,
    p_price         numeric,
    p_carrier       varchar,
    p_carrier_other varchar,
    OUT new_id      int
)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_created_by::text, true);

    INSERT INTO "Shipments" (
        "ss_id", "created_by", "supplier_id", "customer_id", "minio_id",
        "tracking_num", "sender_name", "receiver_name", "sender_cp", "receiver_cp",
        "weight", "service", "creation_date", "cost", "price",
        "carrier", "carrier_other"
    ) VALUES (
        p_ss_id, p_created_by, p_supplier_id, p_customer_id, p_minio_id,
        p_tracking_num, p_sender_name, p_receiver_name, p_sender_cp, p_receiver_cp,
        p_weight, p_service, p_creation_date, p_cost, p_price,
        p_carrier, p_carrier_other
    )
    RETURNING "shipment_id" INTO new_id;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_shipment_update_status(p_id int, p_ss_id int, p_user_id int)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::text, true);
    UPDATE "Shipments" SET "ss_id" = p_ss_id WHERE "shipment_id" = p_id;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_shipment_remove_supplier(p_id int, p_user_id int)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::text, true);
    UPDATE "Shipments" SET "supplier_id" = NULL WHERE "shipment_id" = p_id;
END;
$$;

-- Full-form edit: the frontend always sends the complete set of fields (same
-- shape as sp_shipment_create), so every column is set directly rather than
-- COALESCE'd -- this lets clearing "Proveedor"/"Cliente" back to null work.
CREATE OR REPLACE PROCEDURE sp_shipment_update(
    p_id            int,
    p_ss_id         int,
    p_supplier_id   int,
    p_customer_id   int,
    p_tracking_num  varchar,
    p_sender_name   varchar,
    p_receiver_name varchar,
    p_sender_cp     varchar,
    p_receiver_cp   varchar,
    p_weight        varchar,
    p_service       varchar,
    p_creation_date date,
    p_cost          numeric,
    p_price         numeric,
    p_carrier       varchar,
    p_carrier_other varchar,
    p_user_id       int
)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::text, true);

    UPDATE "Shipments"
    SET "ss_id" = p_ss_id,
        "supplier_id" = p_supplier_id,
        "customer_id" = p_customer_id,
        "tracking_num" = p_tracking_num,
        "sender_name" = p_sender_name,
        "receiver_name" = p_receiver_name,
        "sender_cp" = p_sender_cp,
        "receiver_cp" = p_receiver_cp,
        "weight" = p_weight,
        "service" = p_service,
        "creation_date" = p_creation_date,
        "cost" = p_cost,
        "price" = p_price,
        "carrier" = p_carrier,
        "carrier_other" = p_carrier_other
    WHERE "shipment_id" = p_id;
END;
$$;

-- Bulk assign: NULL for p_customer_id/p_supplier_id means "leave that field
-- untouched" for every selected shipment, so callers can assign a customer
-- only, a supplier only, or both in a single call.
CREATE OR REPLACE PROCEDURE sp_shipment_assign(
    p_ids         int[],
    p_customer_id int,
    p_supplier_id int,
    p_user_id     int
)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_user_id::text, true);

    UPDATE "Shipments"
    SET "customer_id" = COALESCE(p_customer_id, "customer_id"),
        "supplier_id" = COALESCE(p_supplier_id, "supplier_id")
    WHERE "shipment_id" = ANY(p_ids);
END;
$$;

-- ---- Documents (MinIO references) -----------------------------------------
CREATE OR REPLACE PROCEDURE sp_document_create(
    p_document_type document_type,
    p_uploaded_by   int,
    p_minio_key     varchar,
    p_notes         text,
    OUT new_id      int
)
LANGUAGE plpgsql
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', p_uploaded_by::text, true);

    INSERT INTO "Minio_documents" ("document_type", "uploaded_by", "minio_key", "notes")
    VALUES (p_document_type, p_uploaded_by, p_minio_key, p_notes)
    RETURNING "minio_id" INTO new_id;
END;
$$;

-- ============================================================================
--  Seed data
-- ============================================================================
-- Shipment statuses
INSERT INTO "Shipments_status" ("ss_name")
SELECT v
FROM (VALUES ('Etiqueta creada'), ('En tránsito'), ('Entregado'), ('Cancelado')) AS t(v)
WHERE NOT EXISTS (SELECT 1 FROM "Shipments_status" s WHERE s."ss_name" = t.v);

-- Rename legacy "Pendiente" status for existing databases
UPDATE "Shipments_status" SET "ss_name" = 'Etiqueta creada' WHERE "ss_name" = 'Pendiente';

-- Bootstrap administrator: Role -> Employee -> User.
-- The login user is admin@gralex.com / admin123 (bcrypt hash via pgcrypto).
DO $$
DECLARE
    v_role_id int;
    v_employee_id int;
    v_admin_id int;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM "Users" WHERE "email" = 'admin@gralex.com') THEN
        INSERT INTO "Roles" ("role_name", "salary", "description")
        VALUES ('Administrador', 0, 'Acceso total al panel administrativo')
        RETURNING "role_id" INTO v_role_id;

        INSERT INTO "Employees" ("role_id", "name", "email", "phone")
        VALUES (v_role_id, 'Administrador Gralex', 'admin.empleado@gralex.com', '0000000000')
        RETURNING "employee_id" INTO v_employee_id;

        INSERT INTO "Users" ("employee_id", "email", "password")
        VALUES (v_employee_id, 'admin@gralex.com', crypt('admin123', gen_salt('bf', 10)))
        RETURNING "user_id" INTO v_admin_id;

        -- Seed test supplier
        INSERT INTO "Suppliers" ("created_by", "name", "credit_amount", "rfc", "phone", "email")
        VALUES (v_admin_id, 'DHL Express', 50000.00, 'DHL010101AAA', '5512345678', 'contacto@dhl.com');

        -- Seed test customer
        INSERT INTO "Customers" ("created_by", "name", "company_name", "cp", "rfc", "phone", "email", "cfdi")
        VALUES (v_admin_id, 'Juan Pérez', 'Empresa Ejemplo S.A. de C.V.', '94500', 'PEPJ010101HDF', '2711234567', 'juan@ejemplo.com', 'G01');
    END IF;
END $$;
