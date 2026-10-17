'use client';

import { useState } from 'react';
import type { HomePageViewProps } from '@/components/workspace/types';
import { WorkspaceNav } from './workspace/workspace-nav';
import { WorkspaceControlsPanel } from './workspace/workspace-controls-panel';
import { WorkspacePreviewPanel } from './workspace/workspace-preview-panel';
import { WorkspaceProxyPanel } from './workspace/workspace-proxy-panel';
import { WorkspaceModals } from './workspace/workspace-modals';
export type { HomePageViewProps } from '@/components/workspace/types';

export function WorkspacePageView({ refs, state, derived, actions }: HomePageViewProps) {
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isAiometadataModalOpen, setIsAiometadataModalOpen] = useState(false);
  const [isRotateModalOpen, setIsRotateModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#030508] font-[var(--font-body)] text-white selection:bg-orange-400/30 xl:h-screen xl:overflow-hidden">
      <div className="relative mx-auto flex w-full max-w-[1840px] flex-col gap-3 px-3 py-3 sm:px-4 sm:py-4 xl:h-full xl:min-h-0">
        <WorkspaceNav refs={refs} state={state} derived={derived} actions={actions} onOpenRotateModal={() => setIsRotateModalOpen(true)} />

        <main className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[minmax(330px,0.95fr)_minmax(0,1.25fr)_minmax(300px,0.9fr)]">
          <WorkspaceControlsPanel state={state} derived={derived} actions={actions} />
          <WorkspacePreviewPanel state={state} derived={derived} />
          <WorkspaceProxyPanel
            state={state}
            derived={derived}
            actions={actions}
            onOpenCatalogModal={() => setIsCatalogModalOpen(true)}
            onOpenPatternsModal={() => setIsAiometadataModalOpen(true)}
          />
        </main>

        <WorkspaceModals
          state={state}
          actions={actions}
          derived={derived}
          isCatalogModalOpen={isCatalogModalOpen}
          setIsCatalogModalOpen={setIsCatalogModalOpen}
          isAiometadataModalOpen={isAiometadataModalOpen}
          setIsAiometadataModalOpen={setIsAiometadataModalOpen}
          isRotateModalOpen={isRotateModalOpen}
          setIsRotateModalOpen={setIsRotateModalOpen}
        />
      </div>
    </div>
  );
}
