import { createContext, useContext } from "react";

// confirm({ title, text, ok, danger }) -> Promise<boolean>; the dialog is <ConfirmProvider> in components/ConfirmDialog.jsx
export const ConfirmContext = createContext(null);
export const useConfirm = () => useContext(ConfirmContext);
