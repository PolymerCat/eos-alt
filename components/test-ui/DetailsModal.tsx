"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface DetailsModalProps {
  children: React.ReactNode;
  modalTitle: string;
  modalContent: React.ReactNode;
}

export default function DetailsModal({ children, modalTitle, modalContent }: DetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="cursor-pointer h-full">
        {children}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-8 md:p-12">
          <div className="relative flex w-full max-w-4xl max-h-[90vh] flex-col rounded-xl border border-border bg-panel p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-border/50 pb-4">
              <h2 className="text-2xl font-bold text-foreground pr-8">{modalTitle}</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="absolute right-6 top-6 rounded-full p-2 hover:bg-accent/10 text-foreground/70 hover:text-accent transition-colors"
                aria-label="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pt-6 text-foreground/90">
              {modalContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
