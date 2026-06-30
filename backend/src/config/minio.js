import { Client } from "minio";

const endPoint = process.env.MINIO_ENDPOINT ?? "minio";
const port = Number(process.env.MINIO_PORT ?? 9000);
const useSSL = String(process.env.MINIO_USE_SSL ?? "false") === "true";

export const bucket = process.env.MINIO_BUCKET ?? "gralex-documents";

export const minioClient = new Client({
  endPoint,
  port,
  useSSL,
  accessKey: process.env.MINIO_ACCESS_KEY ?? process.env.MINIO_ROOT_USER ?? "gralex",
  secretKey: process.env.MINIO_SECRET_KEY ?? process.env.MINIO_ROOT_PASSWORD ?? "gralex123",
});

/**
 * Ensure the documents bucket exists. Called once on server startup so uploads
 * never fail because the bucket is missing.
 */
export const ensureBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(bucket);

    if (!exists) {
      await minioClient.makeBucket(bucket);
      console.log(`[gralex-backend] created MinIO bucket "${bucket}"`);
    }
  } catch (err) {
    console.error("[gralex-backend] could not ensure MinIO bucket", err.message);
  }
};
