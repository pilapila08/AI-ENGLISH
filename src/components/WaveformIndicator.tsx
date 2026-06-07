interface WaveformIndicatorProps {
  active?: boolean;
  compact?: boolean;
}

export default function WaveformIndicator({
  active = false,
  compact = false,
}: WaveformIndicatorProps) {
  return (
    <div
      aria-label={active ? "语音波形活动中" : "语音波形未活动"}
      className={`flex items-center justify-center gap-1 ${compact ? "h-5" : "h-9"}`}
    >
      {Array.from({ length: compact ? 7 : 13 }, (_, index) => (
        <span
          className={`wave-bar w-0.5 rounded-full bg-gradient-to-t from-violet-500 to-cyan-300 ${
            active ? "wave-bar-active" : "opacity-35"
          }`}
          key={index}
          style={{
            animationDelay: `${index * 70}ms`,
            height: `${compact ? 6 + (index % 4) * 3 : 9 + (index % 5) * 5}px`,
          }}
        />
      ))}
    </div>
  );
}
