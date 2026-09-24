'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MonitorPlay, TriangleAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { HomePageViewProps } from '@/components/workspace/types';
import { PANEL_CLASS, PANEL_HEADER_CLASS } from './constants';
import { PanelHeader } from './ui';

type WorkspacePreviewPanelProps = Pick<HomePageViewProps, 'state' | 'derived'>;

function readCollisionWarnings(header: string | null) {
  if (!header) return [];
  return header.split('|').flatMap((value) => {
    try {
      return [decodeURIComponent(value)];
    } catch {
      return [];
    }
  });
}

function PreviewImage({
  previewUrl,
  previewType,
  onCollisionWarnings,
}: {
  previewUrl: string;
  previewType: HomePageViewProps['state']['previewType'];
  onCollisionWarnings: (warnings: string[]) => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    void fetch(previewUrl, { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Preview request failed: ${response.status}`);
        const warnings = readCollisionWarnings(response.headers.get('X-ERDB-Collision-Warnings'));
        const blob = await response.blob();
        if (cancelled) return;
        onCollisionWarnings(warnings);
        objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
      })
      .catch(() => {
        if (cancelled) return;
        onCollisionWarnings([]);
        setImageSrc(previewUrl);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [onCollisionWarnings, previewUrl]);

  return (
    <motion.div
      key="previewedImageContainer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative z-10 flex h-full min-h-0 w-full items-center justify-center"
    >
      {!imageLoaded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-2 overflow-hidden rounded-2xl bg-white/[0.02] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]"
        >
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </motion.div>
      )}
      {imageSrc && (
        <motion.img
          key={imageSrc}
          src={imageSrc}
          alt="Preview"
          onLoad={() => setImageLoaded(true)}
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: imageLoaded ? 1 : 0, filter: imageLoaded ? 'blur(0px)' : 'blur(10px)' }}
          transition={{ duration: 0.4 }}
          className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#030303] object-contain shadow-[0_24px_70px_-35px_rgba(0,0,0,1)] ring-1 ring-white/8 ${
            previewType === 'logo' ? 'block h-auto max-h-full w-full max-w-2xl' : 'block h-auto max-h-full w-auto max-w-full'
          }`}
        />
      )}
    </motion.div>
  );
}

export function WorkspacePreviewPanel({ state, derived }: WorkspacePreviewPanelProps) {
  const { previewType } = state;
  const { previewUrl, previewNotice } = derived;
  const [collisionWarnings, setCollisionWarnings] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const topClass = scrolled ? 'top-24' : 'top-36';
  const handleCollisionWarnings = useCallback((warnings: string[]) => {
    setCollisionWarnings(Array.from(new Set(warnings)));
  }, []);

  return (
    <>
      <div ref={viewportRef} className={`pointer-events-none fixed bottom-0 left-3 right-3 z-0 sm:left-4 sm:right-4 ${topClass}`} />

      {previewNotice && (
        <div className={`fixed right-3 z-40 xl:hidden ${topClass}`}>
          <div className="max-w-[200px] rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-[11px] font-medium text-orange-200 shadow-2xl backdrop-blur-xl">
            {previewNotice}
          </div>
        </div>
      )}

      {previewUrl && (
        <>
          {isExpanded &&
            createPortal(
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm xl:hidden"
                onClick={() => setIsExpanded(false)}
              >
                <motion.img
                  key={previewUrl}
                  src={previewUrl}
                  alt="Preview"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="max-h-[90vh] max-w-[90vw] rounded-2xl border border-white/10 shadow-2xl"
                />
              </div>,
              document.body
            )}
          <motion.div
            drag
            dragMomentum={false}
            dragConstraints={viewportRef}
            whileDrag={{ scale: 1.08, opacity: 0.9 }}
            className={`fixed right-3 z-40 cursor-grab active:cursor-grabbing xl:hidden ${topClass}`}
            onClick={() => setIsExpanded(true)}
          >
            <div className="pointer-events-none overflow-hidden rounded-xl border border-white/15 bg-[#06070b]/80 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
              <img key={previewUrl} src={previewUrl} alt="Preview" className="block h-auto w-24 object-cover" />
            </div>
          </motion.div>
        </>
      )}

      <div className={`${PANEL_CLASS} hidden xl:order-2 xl:flex`}>
        <div className={PANEL_HEADER_CLASS}>
          <PanelHeader
            icon={<MonitorPlay className="h-4 w-4" />}
            title="Preview"
            subtitle="Ratings are normalized to a 0-10 scale."
            accent="teal"
          />
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 pt-3">
          <AnimatePresence mode="wait">
            {previewUrl ? (
              <div key="preview" className="relative flex h-full min-h-0 w-full items-center justify-center">
                <PreviewImage
                  key={previewUrl}
                  previewUrl={previewUrl}
                  previewType={previewType}
                  onCollisionWarnings={handleCollisionWarnings}
                />
              </div>
            ) : previewNotice ? (
              <motion.div
                key="notice"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 max-w-md text-center"
              >
                <div className="text-sm font-semibold text-orange-300">{previewNotice}</div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative z-10 text-sm text-slate-500"
              >
                No preview available.
              </motion.div>
            )}
          </AnimatePresence>

          {previewUrl && previewNotice && (
            <div className="absolute bottom-4 left-1/2 z-20 max-w-[280px] -translate-x-1/2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-center text-[11px] font-medium text-orange-200 shadow-2xl backdrop-blur-xl">
              {previewNotice}
            </div>
          )}
        </div>

        {collisionWarnings.length > 0 && (
          <div
            role="status"
            aria-live="polite"
            className="mx-4 mb-4 shrink-0 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-3.5 py-3 shadow-[0_12px_30px_-20px_rgba(245,158,11,0.7)]"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-200">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              <span>Preview collision warnings</span>
            </div>
            <ul className="mt-2 space-y-1 text-[11px] leading-4 text-amber-100/80">
              {collisionWarnings.map((warning) => (
                <li key={warning}>[ERDB] {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
