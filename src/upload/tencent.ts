import COS from 'cos-nodejs-sdk-v5';
import fs from 'fs';
import { CloudStorageService } from './interface';

export class Tencent implements CloudStorageService {
  private client: COS;
  private config: Environment.Tencent;
  private readonly bucket: string;
  private readonly region: string;

  constructor(config: Environment.Tencent) {
    this.config = config;
    this.client = new COS({
      SecretId: config.secretId,
      SecretKey: config.secretKey,
    });
    this.bucket = config.bucket;
    this.region = config.region;
  }

  async uploadFile(file: File, options: { headers: Record<string, string> }): Promise<void> {
    const { from, to } = file;
    return new Promise((resolve, reject) => {
      this.client.putObject({
        Bucket: this.bucket,
        Region: this.region,
        Key: to,
        Body: fs.createReadStream(from),
        Headers: options.headers,
        ContentLength: fs.statSync(from).size,
        CacheControl: file.isNoCache ? 'no-cache' : undefined,
      }, (err, data) => {
        if (data.statusCode === 200) {
          // logger.uploadSuccess(file);
          // resolve();
          return;
        }
        // logger.uploadFail(file);
        // logger.error(err.message);
        reject(new Error(`Failed to upload ${to}: ${err.message}`));
      });
    });
  }

  async checkFile(file: File): Promise<{ objects: Array<{ name: string; lastModified: Date }> }> {
    const { to } = file;
    return new Promise((resolve, reject) => {
      this.client.headObject({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: to,
      }, (err, data) => {
        if (err) {
          // err.statusCode === 404
          resolve({
            // exists: false,
            objects: [],
          });
        } else {
          resolve({
            objects: [{
              name: to,
              // exists: true,
              lastModified: new Date(data.headers['last-modified']),
            }],
          });
        }
      });
    });
  }
}
