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
    <div className="relative min-h-screen bg-[#06070b] font-[var(--font-body)] text-slate-200 selection:bg-orange-400/30 xl:h-screen xl:overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.12),_transparent_60%)] blur-3xl" />
        <div className="absolute right-[-220px] top-40 h-[420px] w-[520px] rounded-full bg-[radial-gradient(circle,_rgba(14,165,233,0.12),_transparent_60%)] blur-3xl" />
        <div className="absolute bottom-[-140px] left-[-180px] h-[420px] w-[520px] rounded-full bg-[radial-gradient(circle,_rgba(20,184,166,0.12),_transparent_60%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(255,255,255,0.025),_rgba(255,255,255,0)_40%,_rgba(255,255,255,0.02)_100%)]" />
      </div>

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
