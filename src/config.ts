
interface ConfigType {
  auths: {
    [key: string]: Environment.Aliyun | Environment.Qiniu | Environment.Tencent | Environment.Debug;
  };
  retryTimes: number;
  existCheck: boolean;
  options?: {
    headers: Record<string, string>;
  };
}

export const config: ConfigType = {
  auths: {},
  retryTimes: 3,
  existCheck: true,
  options: {
    headers: {},
  },
};
