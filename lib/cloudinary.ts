import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT || 'http://100.70.249.11:9000',
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || '',
    secretAccessKey: process.env.MINIO_SECRET_KEY || '',
  },
  forcePathStyle: true,
});

const BUCKET = process.env.MINIO_BUCKET || 'bnk2026';
const PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'http://100.70.249.11:9000';

export async function uploadToCloudinary(file: File, folder: string = 'categories'): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const ext = file.name.split('.').pop() || 'jpg';
    const key = `${folder}/${uuidv4()}.${ext}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    return `${PUBLIC_URL}/${BUCKET}/${key}`;
  } catch (error) {
    console.error('Error uploading to MinIO:', error);
    throw new Error('Failed to upload file to MinIO');
  }
}

export async function deleteFromCloudinary(publicId: string) {
  try {
    const key = publicId.replace(`${PUBLIC_URL}/${BUCKET}/`, '');
    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }));
    return true;
  } catch (error) {
    console.error('Error deleting from MinIO:', error);
    return false;
  }
}

export default s3Client; 