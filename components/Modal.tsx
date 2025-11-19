"use client";
import React from "react";

export function Modal({ open, title, onClose, children, footer }: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded shadow-lg w-full max-w-md mx-4">
        {title && <div className="px-4 py-3 border-b font-medium">{title}</div>}
        <div className="p-4">{children}</div>
        {footer && <div className="px-4 py-3 border-t bg-neutral-50">{footer}</div>}
      </div>
    </div>
  );
}

