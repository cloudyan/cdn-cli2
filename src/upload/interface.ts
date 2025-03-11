
export interface UploadOptions {
  headers: Record<string, string>;
}

export interface CheckFileResult {
  objects: Array<{
    name: string;
    lastModified: Date;
  }>;
}

export interface CloudStorageService {
  /**
   * 上传文件到云存储
   * @param file 文件信息，包含源路径和目标路径
   * @param options 上传选项，包含请求头等配置
   */
  uploadFile(file: File, options: UploadOptions): Promise<void>;

  /**
   * 检查文件在云存储中的状态
   * @param file 文件信息，主要使用目标路径进行检查
   */
  checkFile(file: File): Promise<CheckFileResult>;
}
