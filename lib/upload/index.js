const chalk = require('chalk');
const { config } = require('../config');
const { Aliyun } = require('./aliyun');
const { Qiniu } = require('./qiniu');
const { Tencent } = require('./tencent');
const logger = require('../logger');
const { getLocalConfig } = require('../init');
const { merge } = require('lodash');

const { red, green } = chalk;

const uploadAdapters = {
  aliyun: Aliyun,
  qiniu: Qiniu,
  tencent: Tencent,
}

// 选择的要上传的空间
const selectedEnvs = [
  'aliyun',
];

exports.upload = async function upload(files) {
  await getLocalConfig().then(res => {
    merge(config.auths, res.default);
    // console.log('auths', config.auths);
  })
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
      logger.info(`${red('OSS 上传出错')}::: ${red(err.code)}-${red(err.name)}: ${red(err.message)}`)
    });
  }))
}

class Upload {
  constructor(adapter, files) {
    this.adapter = adapter;
    this.files = files;
    this.idx = 1;
    this.fileCount = files.length;
  }
  calcPrefix() {
    return '';
  }
  uploadFiles() {
    let i = 1;
    const { fileCount } = this;
    return Promise.all(this.files.map((file) => {
      // const uploadName = `${this.calcPrefix()}/${file.name}`.replace('//', '/');
      if (/\.html/.test(file.to) || config.existCheck !== true) {
        return this.uploadFile(file, i++)
      } else {
        return this.adapter.checkFile(file).then(res => {
          // console.log(res.objects);
          // file.to 不能以 / 开头, 否则 checkFile 不到文件
          const arr = (res.objects || []).filter(item => item.name === file.to);
          if (arr && arr.length > 0) {
            // const timeStr = getTimeStr(new Date(res.objects[0].lastModified));
            // 东八区
            const timeStr = new Date(+new Date(res.objects[0].lastModified) + 28800000).toJSON().substr(0, 19).replace('T', ' ');
            logger.info(`${green('已存在,免上传')} (上传于 ${timeStr}) ${i++}/${fileCount}: ${file.to}`)
          } else {
            // console.log(file.to, 'not exist & need upload');
            throw new Error('not exist & need upload');
          }
        }).catch((err) => {
          // 覆盖上传
          return this.uploadFile(file, i++);
        });
      }
    }))
  }
  uploadFile(file, idx) {
    return new Promise((resolve, reject) => {
      const { from, to } = file;
      // 检查文件是否需要过滤
      if (this.shouldFilterFile(file)) {
        logger.info(`${yellow('文件已过滤')} ${idx}/${this.fileCount}: ${file.to}`);
        return resolve();
      }
      file.$retryTime = 0;
      const self = this;
      const { fileCount, adapter } = this;
      const maxRetries = config.retryTimes || 3; // 默认重试3次

      function uploadAction() {
        file.$retryTime++;
        const retryInfo = file.$retryTime > 1 ? `第${file.$retryTime - 1}次重试` : '';
        logger.info(`开始上传 ${idx}/${fileCount}: ${retryInfo}`, file.to);
        
        adapter.uploadFile(file, self.getOptions(file))
          .then((result) => {
            logger.info(`${green('上传成功')} ${idx}/${fileCount}: ${file.to}`);
            resolve();
          })
          .catch(err => {
            if (file.$retryTime < maxRetries) {
              logger.info(`${yellow('上传失败')} ${idx}/${fileCount}: ${file.to}, 准备第${file.$retryTime}次重试`);
              uploadAction();
            } else {
              logger.error(`${red('上传失败')} ${idx}/${fileCount}: ${file.to}, 已达到最大重试次数 ${maxRetries}`);
              reject(err);
            }
          })
      }
      uploadAction();
    });
  }
  getOptions(file) {
    const { to } = file;
    let options = {headers: {}};
    if (!/\.html/.test(to)) {
      options = JSON.parse(JSON.stringify(config.options || {headers: {}}));
      options.headers['Cache-Control'] = 'max-age=31536000';
    } else {
      options = JSON.parse(JSON.stringify(config.options || {headers: {}}));
      options.headers['Cache-Control'] = 'no-cache';
    }
    return options;
  }
}

function getTimeStr(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`
}
