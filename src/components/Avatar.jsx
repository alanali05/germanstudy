export default function Avatar({ user, size = 40 }) {
  const initials = (user?.name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  // min/max sizes too: a flex parent or the img max-width: 100% default must never squeeze the circle into an oval
  const style = { width: size, height: size, minWidth: size, maxWidth: size, minHeight: size, maxHeight: size, fontSize: size * 0.38 };

  if (user?.avatar) {
    return <img src={user.avatar} alt="" style={style} className="aspect-square shrink-0 rounded-full object-cover" />;
  }
  return (
    <div
      style={style}
      className="flex aspect-square shrink-0 items-center justify-center rounded-full bg-brand font-bold text-on-brand"
    >
      {initials}
    </div>
  );
}
