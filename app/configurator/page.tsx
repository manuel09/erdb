import type { Metadata } from 'next';
import HomePage from '@/components/home-page';
import { WorkspaceAuthPage } from '@/components/workspace-auth-page';
import { getTokenConfig } from '@/lib/tokens';
import { readWorkspaceSession } from '@/lib/workspaceSession';

export const metadata: Metadata = {
  title: 'ERDB Configurator',
  description: 'Dedicated fullscreen configurator and addon proxy workspace for ERDB.',
};

export default async function ConfiguratorPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const guestMode = resolvedSearchParams?.guest === '1';

  if (guestMode) {
    return <HomePage mode="workspace" />;
  }

  const session = await readWorkspaceSession();

  if (!session) {
    return <WorkspaceAuthPage />;
  }

  const tokenConfig = getTokenConfig(session.token);
  if (!tokenConfig) {
    return <WorkspaceAuthPage />;
  }

  return <HomePage mode="workspace" initialToken={session.token} initialConfig={tokenConfig.config} />;
}
