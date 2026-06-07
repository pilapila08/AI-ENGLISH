function writeString(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function encodeWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const channelCount = audioBuffer.numberOfChannels;
  const sampleCount = audioBuffer.length;
  const bytesPerSample = 2;
  const dataSize = sampleCount * channelCount * bytesPerSample;
  const wavBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wavBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channelCount, true);
  view.setUint32(24, audioBuffer.sampleRate, true);
  view.setUint32(
    28,
    audioBuffer.sampleRate * channelCount * bytesPerSample,
    true,
  );
  view.setUint16(32, channelCount * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  const channels = Array.from({ length: channelCount }, (_, index) =>
    audioBuffer.getChannelData(index),
  );
  let offset = 44;

  for (let sample = 0; sample < sampleCount; sample += 1) {
    for (let channel = 0; channel < channelCount; channel += 1) {
      const value = Math.max(-1, Math.min(1, channels[channel][sample]));
      view.setInt16(
        offset,
        value < 0 ? value * 0x8000 : value * 0x7fff,
        true,
      );
      offset += bytesPerSample;
    }
  }

  return wavBuffer;
}

export async function convertAudioBlobToWav(audioBlob: Blob): Promise<Blob> {
  const audioContext = new AudioContext();

  try {
    const sourceBuffer = await audioBlob.arrayBuffer();
    const decodedAudio = await audioContext.decodeAudioData(sourceBuffer.slice(0));
    const targetSampleRate = 16_000;
    const offlineContext = new OfflineAudioContext(
      1,
      Math.max(1, Math.ceil(decodedAudio.duration * targetSampleRate)),
      targetSampleRate,
    );
    const source = offlineContext.createBufferSource();
    source.buffer = decodedAudio;
    source.connect(offlineContext.destination);
    source.start();
    const optimizedAudio = await offlineContext.startRendering();

    return new Blob([encodeWav(optimizedAudio)], { type: "audio/wav" });
  } finally {
    await audioContext.close();
  }
}
