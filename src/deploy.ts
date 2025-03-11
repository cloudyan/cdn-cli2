import path from 'path';
import { getFiles } from './files';
import { upload } from './upload/index';

interface DeployOptions {
  site?: boolean;
  force?: boolean;
  preview?: boolean;
}

// 安全检查
// 如果上传的文件包含了 package.json 则取消上传
function securityCheck(files: File[], from: string): void {
  const securityCheck = files.some((file) => { return /package\.json$/.test(file.from) });
  if (securityCheck) {
    console.log(`\n操作取消: 请检查上传目录是否符合预期 ${path.resolve('.', from)}\n`);
    process.exit(1);
  }
}

async function deployAction(from: string = './', to: string = './cdn', options: DeployOptions = {}): Promise<void> {
  // 先检查 auth 配置, 如果配置不存在, 直接报错
  to = to.replace(/^\//, ''); // to 不能以 / 开头

  getFiles(from, to, options).then(files => {
    securityCheck(files, from);

    if (options.site) {
      console.log('\n当前为: 站点部署模式\n'); // 修改配置项
    }

    if (options.preview) {
      console.log(files);
      process.exit(1);
    } else {
      upload(files);
    }
  });
}

export default deployAction;
