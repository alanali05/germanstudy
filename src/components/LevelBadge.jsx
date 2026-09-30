export default function LevelBadge({ level, size = "sm" }) {
  return (
    <span className={`level-badge ${size === "lg" ? "lb-lg" : "lb-sm"}`} style={{ "--c": level.color }} dir="ltr">
      {level.title}
    </span>
  );
}
