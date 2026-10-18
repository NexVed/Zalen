"use client";
import type { ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import styles from "./Hub.module.css";

export function BoardDialog({ title, onClose, maxWidth = 600, children }: { title: string; onClose: () => void; maxWidth?: number; children: ReactNode }) {
  return <Dialog.Root open onOpenChange={open => { if (!open) onClose(); }}><Dialog.Portal>
    <Dialog.Overlay className={styles.overlay} />
    <Dialog.Content className={styles.dialog} style={{ maxWidth }} aria-label={title} aria-describedby={undefined}>
      <div className={styles.dialogScroll}>{children}</div>
    </Dialog.Content>
  </Dialog.Portal></Dialog.Root>;
}
