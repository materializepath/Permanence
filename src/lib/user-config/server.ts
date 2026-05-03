import {
  DEFAULT_USER_CONFIG,
  ensureProgrammerFiles,
  type UserConfig,
} from "@/lib/programmer/file-store";

export async function readUserConfig(): Promise<UserConfig> {
  try {
    const files = await ensureProgrammerFiles();
    return files.userConfig;
  } catch {
    return DEFAULT_USER_CONFIG;
  }
}
