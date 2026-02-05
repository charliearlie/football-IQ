interface GameModeRibbonProps {
  text?: string;
}

export function GameModeRibbon({ text = "FAN FAVORITE" }: GameModeRibbonProps) {
  return (
    <div className="absolute top-0 right-0 overflow-hidden w-24 h-24 pointer-events-none">
      <div className="ribbon">{text}</div>
    </div>
  );
}
