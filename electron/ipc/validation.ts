import type { IpcMainInvokeEvent } from "electron";

export function assertTrustedSender(event: IpcMainInvokeEvent): void {
  const url = event.senderFrame?.url ?? "";
  const developmentUrl = process.env.VITE_DEV_SERVER_URL;
  const trusted =
    url.startsWith("file://") ||
    Boolean(developmentUrl && url.startsWith(developmentUrl));

  if (!trusted) {
    throw new Error("IPC request rejected from an untrusted renderer.");
  }
}

export function assertString(
  value: unknown,
  name: string,
  maximumLength: number,
): asserts value is string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.length > maximumLength
  ) {
    throw new Error(
      `${name} must be a non-empty string under ${maximumLength} characters.`,
    );
  }
}

export function toAudioBuffer(value: unknown, maximumBytes: number): Buffer {
  if (!(value instanceof ArrayBuffer) && !ArrayBuffer.isView(value)) {
    throw new Error("Audio data must be an ArrayBuffer or typed array.");
  }

  const bytes =
    value instanceof ArrayBuffer
      ? value
      : value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
  const buffer = Buffer.from(bytes);

  if (buffer.length === 0) {
    throw new Error("Audio data is empty.");
  }
  if (buffer.length > maximumBytes) {
    throw new Error(`Audio data exceeds the ${maximumBytes} byte limit.`);
  }

  return buffer;
}
