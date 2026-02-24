import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT!,
  region: process.env.MINIO_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // obligatoire pour MinIO
});

const BUCKET = process.env.MINIO_BUCKET ?? "bnk2026";

/** Taille maximale d'upload : 5 Mo */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Types MIME acceptés */
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * Upload un fichier dans MinIO.
 * Retourne l'URL publique du fichier.
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return getPublicUrl(key);
}

/**
 * Génère une URL signée temporaire (accès privé, expire après `expiresIn` secondes).
 */
export async function getSignedFileUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Supprime un fichier dans MinIO.
 */
export async function deleteFile(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * Retourne l'URL publique d'un fichier (bucket public).
 */
export function getPublicUrl(key: string): string {
  const endpoint = process.env.MINIO_PUBLIC_URL ?? process.env.MINIO_ENDPOINT;
  return `${endpoint}/${BUCKET}/${key}`;
}

/**
 * Génère une clé unique pour un fichier uploadé.
 * Format : uploads/2024/01/uuid.ext
 */
export function generateFileKey(
  originalName: string,
  folder = "uploads"
): string {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "bin";
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const uuid = crypto.randomUUID();
  return `${folder}/${year}/${month}/${uuid}.${ext}`;
}
