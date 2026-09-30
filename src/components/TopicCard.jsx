
import { Link } from "react-router-dom";
import Icon from "./Icon";

export default function TopicCard({
  to,
  title,
  subtitle,
  info,
  index,
}) {
  return (
    <Link
      to={to}
      className="accent-card flex items-center gap-4 rounded-2xl p-4 transition-transform hover:scale-[1.01]"
    >
      {/* Topic number */}
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white shadow-sm"
        style={{
          background: "var(--accent)",
        }}
      >
        {index}
      </div>

      {/* Topic information */}
      <div className="min-w-0 flex-1">
        <h3
          dir="auto"
          className="truncate text-lg font-semibold"
        >
          {title}
        </h3>

        {subtitle && (
          <p
            dir="auto"
            className="truncate text-muted"
          >
            {subtitle}
          </p>
        )}

        {info && (
          <p className="text-sm text-muted">
            {info}
          </p>
        )}
      </div>

      {/* Arrow */}
      <Icon
        name="chevron"
        className="shrink-0 text-faint rtl:rotate-180"
      />
    </Link>
  );
}

