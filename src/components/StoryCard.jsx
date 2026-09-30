import { Link } from "react-router-dom";
import Icon from "./Icon";

// Takes its color from --accent (set by the page)
export default function StoryCard({ to, index, story }) {
  return (
    <Link
      to={to}
      state={{ index }}
      // Fixed height on bigger screens: the image can NEVER change the card size
      className="accent-card flex min-h-[88px] w-full items-stretch overflow-hidden rounded-xl sm:h-40 sm:min-h-0 sm:rounded-2xl"
    >
      {/* Image: fixed-size box, image is absolute inside it */}
      {story.coverImage && (
        <div className="relative hidden h-full w-32 shrink-0 overflow-hidden sm:block lg:w-44">
          <img
            src={story.coverImage}
            alt=""
            loading="lazy"
            onError={(e) => (e.currentTarget.style.display = "none")}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      )}

      {/* Number badge */}
      {index != null && (
        <div className="flex shrink-0 items-center px-3 sm:px-5">
          <span
            className="grid size-9 place-items-center rounded-lg text-sm font-bold tabular-nums
                       sm:size-12 sm:rounded-xl sm:text-lg"
            style={{
              background: "color-mix(in srgb, var(--accent) 18%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
              color: "var(--fg)",
            }}
          >
            {index}
          </span>
        </div>
      )}

      {/* Text */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-3.5 pe-2 sm:gap-1 sm:py-4">
        <h3
          dir="ltr"
          lang="de"
          className="font-display line-clamp-2 break-words text-base font-semibold leading-snug sm:text-xl lg:text-2xl"
        >
          {story.titleDe}
        </h3>
        <p dir="rtl" lang="ku" className="line-clamp-2 break-words text-sm text-muted sm:line-clamp-1 sm:text-base">
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