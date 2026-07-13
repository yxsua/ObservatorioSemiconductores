import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import styles from "./PageFeedback.module.css";

interface PageFeedbackProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function PageFeedback({
  actionLabel,
  children,
  message,
  onAction,
  title
}: PageFeedbackProps) {
  return (
    <section className={styles.feedback} aria-labelledby="feedback-title">
      <h1 id="feedback-title">{title}</h1>
      <p>{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">{actionLabel}</Button>
      )}
      {children}
    </section>
  );
}
