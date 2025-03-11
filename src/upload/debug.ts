import { CloudStorageService } from './interface';

class DebugOss {
  options: Environment.Debug
  constructor(options) {
    this.options = options;
  }

  async put(to: string, from: string, options: Record<string, any>) {
    return Promise.resolve();
  }

  async list(options): Promise<{ objects: Array<{ name: string; lastModified: Date }> }> {
    const bool = Math.random() > 0.1
    return Promise.resolve({objects: [{
      name: '',
      lastModified: new Date(),
    }]})
  }
}

export class Debug implements CloudStorageService {
  private client: DebugOss;
  private config: Environment.Debug;

  constructor(config) {
    this.config = config;
    this.client = new DebugOss(config);
  }

  async uploadFile(file: File, options: { headers: Record<string, string> }): Promise<void> {
    const { from, to } = file;
    return this.client.put(to, from, options);
  }

  async checkFile(file: File): Promise<{ objects: Array<{ name: string; lastModified: Date }> }> {
    const { to } = file;
    const result = await this.client.list({
      prefix: to,
      'max-keys': 1, // 50
    });
    return result;
  }
}

module.exports = Debug;
