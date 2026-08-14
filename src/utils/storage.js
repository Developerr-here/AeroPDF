import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let s3Client = null;

// Only initialize the client if we are using bucket storage, 
// to avoid crash if credentials are not configured yet in local environments.
function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || 'auto',
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      }
    });
  }
  return s3Client;
}

export const isStorageBucketEnabled = () => {
  return process.env.FILE_STORAGE_MODE === 'bucket';
};

export async function uploadOutputToBucket(buffer, { contentType, contentDisposition, prefix, filename }) {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error('S3_BUCKET environment variable is missing.');
  }

  // Create a safe, collision-resistant key
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const randomId = Math.random().toString(36).substring(2, 10);
  const key = `${prefix || 'outputs'}/${dateStr}/${randomId}-${safeFilename}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ContentDisposition: contentDisposition || `attachment; filename="${safeFilename}"`
  });

  await getS3Client().send(command);
  console.log(`[Storage] Uploaded output: ${key} (${buffer.length} bytes)`);

  return key;
}

export async function createOutputDownloadUrl(key, expiresIn = 600) {
  const bucket = process.env.S3_BUCKET;
  
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const url = await getSignedUrl(getS3Client(), command, { expiresIn });
  console.log(`[Storage] Presigned URL generated for: ${key}`);
  
  return url;
}
