import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function runShopifyCommand(command: string, cwd: string): Promise<{ stdout: string; stderr: string }> {
  // On Windows, use powershell with execution policy bypass to run shopify commands
  const fullCommand = `powershell -ExecutionPolicy Bypass -Command "shopify ${command}"`;
  
  try {
    const { stdout, stderr } = await execAsync(fullCommand, { cwd });
    return { stdout, stderr };
  } catch (error: any) {
    if (error.stdout || error.stderr) {
      return { stdout: error.stdout || "", stderr: error.stderr || "" };
    }
    throw error;
  }
}

export async function getAppInfo(cwd: string) {
  const { stdout } = await runShopifyCommand("app info --json", cwd);
  try {
    return JSON.parse(stdout);
  } catch (e) {
    throw new Error(`Failed to parse shopify app info: ${stdout}`);
  }
}

export async function deployApp(cwd: string) {
  // Use --force to avoid interactive prompts
  return await runShopifyCommand("app deploy --force", cwd);
}
