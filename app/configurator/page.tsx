import type { Metadata } from 'next';
import HomePage from '@/components/home-page';

export const metadata: Metadata = {
  title: 'ERDB Configurator',
  description: 'Dedicated fullscreen configurator and addon proxy workspace for ERDB.',
};

export default function ConfiguratorPage() {
  return <HomePage mode="workspace" />;
}
