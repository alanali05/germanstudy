import { Link } from "react-router-dom";

export default function EmptyState({ title, text, linkTo, linkLabel }) {
  return (
    <div className="glass rounded-2xl p-8 text-center sm:p-12">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {text && <p className="mx-auto mt-2 max-w-md text-muted">{text}</p>}
      {linkTo && (
        <Link to={linkTo} className="btn-primary mt-6 inline-block px-5 py-3">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
