import { execFile } from "node:child_process";

const DEFAULT_HERMES_COMMAND = "professor";
const DEFAULT_TIMEOUT_MS = 120_000;

type HermesChatInput = {
  prompt: string;
  maxTurns?: number;
  timeoutMs?: number;
};

export async function askHermes({
  prompt,
  maxTurns = 8,
  timeoutMs: requestedTimeoutMs,
}: HermesChatInput) {
  const command = process.env.HERMES_COMMAND ?? DEFAULT_HERMES_COMMAND;
  const timeoutMs =
    requestedTimeoutMs ?? Number(process.env.HERMES_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);

  const output = await execHermes(
    command,
    [
      "chat",
      "--quiet",
      "--query",
      prompt,
      "--source",
      "tool",
      "--max-turns",
      String(maxTurns),
    ],
    timeoutMs,
  );
  const response = cleanHermesOutput(output);

  if (!response) {
    throw new Error("Hermes returned an empty response.");
  }

  return response;
}

function execHermes(command: string, args: string[], timeoutMs: number) {
  return new Promise<string>((resolve, reject) => {
    execFile(
      command,
      args,
      {
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024 * 4,
        env: {
          ...process.env,
          NO_COLOR: "1",
        },
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(formatHermesError(error, stdout, stderr, timeoutMs)));
          return;
        }

        resolve(stdout);
      },
    );
  });
}

function formatHermesError(
  error: Error,
  stdout: string,
  stderr: string,
  timeoutMs: number,
) {
  const errno = error as NodeJS.ErrnoException & {
    killed?: boolean;
    signal?: string;
  };

  if (errno.killed || errno.signal === "SIGTERM") {
    return `Hermes timed out after ${Math.round(timeoutMs / 1000)} seconds.`;
  }

  const details = stderr.trim() || stdout.trim();

  if (!details) {
    return "Hermes command failed before returning a response.";
  }

  return details.length > 1200 ? `${details.slice(0, 1200).trim()}...` : details;
}

function cleanHermesOutput(output: string) {
  return output
    .replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, "")
    .split("\n")
    .filter((line) => !/^Session (ID|saved|info):/i.test(line.trim()))
    .join("\n")
    .trim();
}
