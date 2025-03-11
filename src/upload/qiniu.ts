import qiniu from 'qiniu';
import { CloudStorageService } from './interface';

export class Qiniu implements CloudStorageService {
  // private formUploader: qiniu.form_up.FormUploader;
  private client: qiniu.form_up.FormUploader;
  private readonly bucket: string;
  private readonly config: Environment.Qiniu;
  private readonly mac: qiniu.auth.digest.Mac;
  private readonly putExtra: qiniu.form_up.PutExtra;
  private readonly putPolicy: qiniu.rs.PutPolicy;
  private readonly uploadToken: string;

  constructor(config: Environment.Qiniu) {
    this.config = config;
    this.mac = new qiniu.auth.digest.Mac(
      config.accessKey,
      config.secretKey,
    );
    this.putPolicy = new qiniu.rs.PutPolicy({
      scope: config.bucket,
    });
    this.bucket = config.bucket;
    this.uploadToken = this.putPolicy.uploadToken(this.mac);
    const config2 = new qiniu.conf.Config();
    // config2.zone = qiniu.zone[config.region];
    this.client = new qiniu.form_up.FormUploader(config2);
    this.putExtra = new qiniu.form_up.PutExtra();
  }

  async uploadFile(file: File, options: { headers: Record<string, string> }): Promise<void> {
    const { from, to } = file;
    return new Promise((resolve, reject) => {
      this.client.putFile(
        this.uploadToken,
        to, // to.substring(1); Fixed to path problems
        from,
        this.putExtra,
        (err, body, respInfo) => {
          if (respInfo.statusCode === 200) {
            // logger.uploadSuccess(file);
            resolve();
            return;
          }
          // logger.uploadFail(file);
          // console.log(err?.message);
          reject(
            new Error(
              `Failed to upload ${file.to}: ${err?.message || 'Unknown error'}`,
            ),
          );
        }
      );
    });
  }

  async checkFile(file: File): Promise<{ objects: Array<{ name: string; lastModified: Date }> }> {
    const { to } = file;
    const bucketManager = new qiniu.rs.BucketManager(this.mac);
    return new Promise((resolve, reject) => {
      bucketManager.stat(this.bucket, to, (err, respBody, respInfo) => {
        if (err || respInfo.statusCode !== 200) {
          reject(err);
        } else {
          // respInfo.statusCode === 200
          // const timeStr = new Date(
          //   +new Date(respBody.putTime / 10000) + 28800000,
          // )
          //   .toJSON()
          //   .substring(0, 19)
          //   .replace('T', ' ');
          // logger.info(
          //   `${green('已存在,免上传')} (上传于 ${timeStr}) ${this.i++}/${
          //     this.fileCount
          //   }: ${file.to}`,
          // );
          resolve({
            objects: [{
              name: to,
              lastModified: new Date(respBody.putTime / 10000),
            }],
          });
        }
      });
    });
  }
}
