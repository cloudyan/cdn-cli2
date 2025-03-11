import OSS from 'ali-oss';
import fs from 'fs';
import { CheckFileResult, CloudStorageService, UploadOptions } from './interface';

export class Aliyun implements CloudStorageService {
  private client: OSS;
  private config: Environment.Aliyun;

  constructor(config: Environment.Aliyun) {
    this.config = config;
    this.client = new OSS({
      region: config.region,
      bucket: config.bucket,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
    });
  }

  async uploadFile(file: File, options: UploadOptions): Promise<void> {
    return this.uploadFileByStream(file, options);
  }

  async uploadFileByPut(file: File, options: UploadOptions): Promise<void> {
    const { from, to } = file;
    return this.client.put(to, from, options);
  }

  async uploadFileByStream(file: File, options: UploadOptions): Promise<void> {
    const { from, to } = file;
    const stream = fs.createReadStream(from);
    return this.client.putStream(to, stream, {
      headers: options.headers,
      timeout: 60000, // 设置60秒超时
    });
  }

  async checkFile(file: File): Promise<CheckFileResult> {
    const { to } = file;
    return this.client.list({
      prefix: to,
      'max-keys': 1, // 优化: 只需要检查文件是否存在，将max-keys从50减少到1
    });
  }
}
