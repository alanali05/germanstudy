export default function Avatar({ user, size = 40 }) {
  const initials = (user?.name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const style = { width: size, height: size, fontSize: size * 0.38 };

  if (user?.avatar) {
    return <img src={user.avatar} alt="" style={style} className="shrink-0 rounded-full object-cover" />;
  }
  return (
    <div
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-brand font-bold text-on-brand"
    >
      {initials}
    </div>
  );
}
