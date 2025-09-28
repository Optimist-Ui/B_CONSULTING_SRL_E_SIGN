const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

class S3Service {
  constructor() {
    this.s3 = new S3Client({ region: process.env.AWS_REGION });
    this.bucket = process.env.AWS_S3_BUCKET;
  }

  async getSignedUrl(key, expiresIn = 3600) { // 1 hour default
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return await getSignedUrl(this.s3, command, { expiresIn });
  }
}

module.exports = S3Service;