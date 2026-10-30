import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmContext } from "../context/ConfirmContext";
import { useLang } from "../context/LangContext";

// One "are you sure?" dialog for the whole app (replaces window.confirm).
// const confirm = useConfirm();  if (await confirm({ title, text, ok, danger: true })) { ... }
// Resolves true for the ok button, false for cancel / Escape / a click next to the dialog.
export function ConfirmProvider({ children }) {
  const { t } = useLang();
  const [req, setReq] = useState(null); // { title, text, ok, danger, resolve }
  const ref = useRef(null);
  const confirm = useCallback((opts) => new Promise((resolve) => setReq({ ...opts, resolve })), []);

  useEffect(() => {
    if (req && !ref.current.open) ref.current.showModal();
  }, [req]);

  const close = (result) => {
    ref.current?.close(); // gives focus back to the button that opened it
    req.resolve(result);
    setReq(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {req && (
        <dialog
          ref={ref} aria-labelledby="confirm-title" className="confirm-dialog"
          onCancel={(e) => { e.preventDefault(); close(false); }}
          onClick={(e) => e.target === ref.current && close(false)} // the backdrop (the box itself has no padding)
        >
          <div className="p-6">
            <h2 id="confirm-title" className="text-xl font-bold" dir="auto">{req.title}</h2>
            {req.text && <p className="mt-2 text-muted" dir="auto">{req.text}</p>}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button type="button" autoFocus onClick={() => close(false)} className="btn-ghost px-5">{t("common.cancel")}</button>
              <button type="button" onClick={() => close(true)} className={`${req.danger ? "btn-bad" : "btn-primary"} px-5`}>{req.ok}</button>
            </div>
          </div>
        </dialog>
      )}
    </ConfirmContext.Provider>
  );
}
