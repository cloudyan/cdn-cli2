import chalk from 'chalk';

import { config } from '../config';
import * as logger from '../logger';
import { Aliyun } from './aliyun';
import { Qiniu } from './qiniu';
import { Tencent } from './tencent';

// await getLocalConfig().then(res => {
//   merge(config.auths, res.default);
// });

const { red, green } = chalk;

type UploadAdapter = Aliyun | Qiniu | Tencent;

export const uploadAdapters: Record<string, new (config: { [key: string]: any }) => UploadAdapter> = {
  aliyun: Aliyun,
  qiniu: Qiniu,
  tencent: Tencent,
};

// 选择的要上传的空间
const selectedEnvs = [
  'aliyun',
];

export async function upload(files: File[]): Promise<any[]> {
  return Promise.all(selectedEnvs.map(env => {
    const auth = config.auths[env];
    const uploadAdapter = uploadAdapters[auth.type];
    const adapter = new uploadAdapter(auth);
    const uploader = new Upload(adapter, files);
    logger.info(`${green('\nOSS 上传开始......')}`);
    return uploader.uploadFiles(files).then(() => {
      logger.info(`${green('OSS 上传完成\n')}`);
    })
    .catch((err) => {
      logger.info(`${red('OSS 上传出错')}::: ${red(err.code)}-${red(err.name)}: ${red(err.message)}`);
    });
  }));
}

class Upload {
  private adapter: UploadAdapter;
  private files: File[];
  private idx: number;
  private fileCount: number;

  constructor(adapter: UploadAdapter, files: File[]) {
    this.adapter = adapter;
    this.files = files;
    this.idx = 1;
    this.fileCount = files.length;
  }

  private calcPrefix(): string {
    return '';
  }

  public uploadFiles(): Promise<void[]> {
    let i = 1;
    const { fileCount } = this;
    return Promise.all(this.files.map((file) => {
      if (/\.html/.test(file.to) || config.existCheck !== true) {
        return this.uploadFile(file, i++);
      } else {
        return this.adapter.checkFile(file).then(res => {
          const arr = (res.objects || []).filter(item => item.name === file.to);
          if (arr && arr.length > 0) {
            const timeStr = new Date(+new Date(res.objects[0].lastModified) + 28800000).toJSON().substr(0, 19).replace('T', ' ');
            logger.info(`${green('已存在,免上传')} (上传于 ${timeStr}) ${i++}/${fileCount}: ${file.to}`);
          } else {
            throw new Error('not exist & need upload');
          }
        }).catch(() => {
          return this.uploadFile(file, i++);
        });
      }
    }));
  }

  private uploadFile(file: File, idx: number): Promise<void> {
    return new Promise((resolve, reject) => {
      file.$retryTime = 0;
      const self = this;
      const { fileCount, adapter } = this;

      function uploadAction() {
        file.$retryTime++;
        logger.info(`开始上传 ${idx}/${fileCount}: ${file.$retryTime > 1 ? '第' + (file.$retryTime - 1) + '次重试' : ''}`, file.to);
        adapter.uploadFile(file, self.getOptions(file))
          .then(() => {
            logger.info(`上传成功 ${idx}/${fileCount}: ${file.to}`);
            resolve();
          }).catch(err => {
            if (file.$retryTime <= config.retryTimes) {
              uploadAction();
            } else {
              reject(err);
            }
          });
      }
      uploadAction();
    });
  }

  private getOptions(file: File): { headers: Record<string, string> } {
    const { to } = file;
    let options = { headers: {} };
    if (!/\.html/.test(to)) {
      options = JSON.parse(JSON.stringify(config.options || { headers: {} }));
      options.headers['Cache-Control'] = 'max-age=31536000';
    }
    return options;
  }
}
