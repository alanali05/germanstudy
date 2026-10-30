import { Link } from "react-router-dom";
import Icon from "./Icon";

// Takes its color from --accent (set by the page)
const badgeStyle = {
  background: "color-mix(in srgb, var(--accent) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
  color: "var(--fg)",
};

export default function StoryCard({ to, index, story }) {
  const cover = !!story.coverImage;
  return (
    <Link
      to={to}
      state={{ index }}
      // Fixed height on every screen: neither the image nor a long title can change the card size
      className="accent-card flex h-32 w-full items-stretch overflow-hidden rounded-xl sm:h-40 sm:rounded-2xl"
    >
      {/* Image: fixed-size box (stretched to the card height), image is absolute inside it */}
      {cover && (
        <div className="relative w-24 shrink-0 self-stretch overflow-hidden bg-soft sm:w-32 lg:w-44">
          <img
            src={story.coverImage}
            alt=""
            loading="lazy"
            onError={(e) => (e.currentTarget.style.display = "none")}
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Phones: the number sits on the image, so the title keeps its room */}
          {index != null && (
            <span
              className="absolute start-1.5 top-1.5 grid size-7 place-items-center rounded-md text-xs font-bold tabular-nums backdrop-blur sm:hidden"
              style={{ ...badgeStyle, background: "color-mix(in srgb, var(--card) 75%, transparent)" }}
            >
              {index}
            </span>
          )}
        </div>
      )}

      {/* Number badge (on phones only without an image) */}
      {index != null && (
        <div className={`shrink-0 items-center px-3 sm:flex sm:px-5 ${cover ? "hidden" : "flex"}`}>
          <span
            className="grid size-9 place-items-center rounded-lg text-sm font-bold tabular-nums
                       sm:size-12 sm:rounded-xl sm:text-lg"
            style={badgeStyle}
          >
            {index}
          </span>
        </div>
      )}

      {/* Text */}
      <div className={`flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-3.5 pe-2 sm:gap-1 sm:py-4 ${index == null ? "ps-4 sm:ps-5" : cover ? "ps-3 sm:ps-0" : ""}`}>
        <h3
          dir="ltr"
          lang={story.lang}
          className="font-display line-clamp-2 break-words text-base font-semibold leading-snug sm:text-xl lg:text-2xl"
        >
          {story.title}
        </h3>
        <p dir="rtl" lang="ku" className="line-clamp-1 break-words text-sm text-muted sm:text-base">
          {story.titleKu}
        </p>
        {story.readTime && <p className="text-xs text-muted sm:text-sm">{story.readTime}</p>}
      </div>

      <Icon
        name="chevron"
        className="my-auto mx-3 size-5 shrink-0 text-faint sm:mx-4 sm:size-6 rtl:rotate-180"
      />
    </Link>
  );
}