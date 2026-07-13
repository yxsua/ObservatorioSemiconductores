import { PageFeedback } from "@/components/feedback/PageFeedback";

interface PlaceholderPageProps {
  title: string;
  message?: string;
}

export function PlaceholderPage({
  message = "Esta ruta ya forma parte de la aplicación y se conectará en su incremento vertical.",
  title
}: PlaceholderPageProps) {
  return <PageFeedback message={message} title={title} />;
}
