import { JarvisConfigPage } from './JarvisConfigPage';

interface AssistPageProps {
  onNavigateBack?: () => void;
}

export function AssistPage({ onNavigateBack }: AssistPageProps) {
  return <JarvisConfigPage onNavigateBack={onNavigateBack} />;
}
