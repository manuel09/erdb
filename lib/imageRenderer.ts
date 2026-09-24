import { bufferToArrayBuffer, getProviderIconDataUri, getSharpFactory, getSourceImagePayload } from '@/lib/imageAssetPipeline';
import { buildPosterTitleSvg, buildThumbnailFallbackTitleSvg } from '@/lib/imageSvgText';
import {
  buildBadgeSvg,
  buildQualityBadgeSvg,
  buildRankingBadgeSvg,
  DEFAULT_BADGE_MIN_METRICS,
  chunkBy,
  estimateBadgeHeight,
  estimateBadgeWidth,
  fitPosterBadgeMetricsToHeight,
  fitPosterBadgeMetricsToWidth,
  getBackdropBadgePlacement,
  getMaxBadgeColumnCount,
  getMinimumCompressedBadgeWidth,
  measureBadgeColumnHeight,
  measureBadgeRowWidth,
  normalizeVerticalBadgeContent,
  splitBackdropVerticalBadgesIntoColumns,
  splitPosterBadgesByLayout,
  type BackdropBadgePlacement,
  type BadgeLayoutMetrics,
} from '@/lib/badgeLayoutSvg';
import {
  LOGO_FALLBACK_ASPECT_RATIO,
  STREAM_BADGE_META,
  buildProviderMonogram,
  outputFormatToContentType,
  resolvePosterQualityBadgePlacement,
  type BadgeKey,
  type RatingBadge,
  type StreamBadgeKey,
} from '@/lib/ratingBadgeLogic';
import { RANKING_ICON_URL } from '@/lib/routeConfig';
import { measurePhase } from '@/lib/routeShared';
import { findFirstNonOverlappingRect, rectsOverlap, type OverlayRect } from '@/lib/overlayCollision';
import type { FastRenderInput, PhaseDurations, QualityBadgesSide, RenderedImagePayload } from '@/lib/routeTypes';
export const renderWithSharp = async (
  input: FastRenderInput,
  phases: PhaseDurations
): Promise<RenderedImagePayload> => {
  const sharp = await getSharpFactory();

  return await measurePhase(phases, 'render', async () => {
    const imageWidth = input.imageWidth ?? input.outputWidth;
    const imageHeight = input.imageHeight ?? input.outputHeight;
    const sourcePayload = await getSourceImagePayload(input.imgUrl);
    const sourceBuffer = Buffer.from(sourcePayload.body);
    const overlays: Array<{ input: Buffer; top: number; left: number }> = [];
    const collisionWarnings: string[] = [];
    const warnCollision = (message: string) => {
      collisionWarnings.push(message);
      console.warn(`[ERDB] ${message}`);
    };
    const transparentBackground = { r: 0, g: 0, b: 0, alpha: 0 };
    const usePosterLayout = input.imageType === 'poster' || input.backdropAsPoster === true;
    let imageLeft = Math.max(0, Math.floor((input.outputWidth - imageWidth) / 2));
    let imageTop = 0;
    let renderedImageHeight = imageHeight;
    const baseImagePipeline = input.imageType === 'logo'
      ? null
      : sharp(sourceBuffer).resize(imageWidth, imageHeight, {
        fit: 'cover',
        position: 'center',
        background: transparentBackground,
      });
    const resizedImageBuffer: Buffer =
      input.imageType === 'logo'
        ? await (async () => {
          const trimmedLogo = await sharp(sourceBuffer)
            .trim({ background: transparentBackground })
            .png({ compressionLevel: 1 })
            .toBuffer({ resolveWithObject: true });
          const trimmedLogoWidth = Math.max(1, trimmedLogo.info.width || imageWidth);
          const trimmedLogoHeight = Math.max(1, trimmedLogo.info.height || imageHeight);
          const logoScale = Math.min(imageWidth / trimmedLogoWidth, imageHeight / trimmedLogoHeight);
          const renderedImageWidth = Math.max(1, Math.round(trimmedLogoWidth * logoScale));
          renderedImageHeight = Math.max(1, Math.round(trimmedLogoHeight * logoScale));
          imageLeft = Math.max(0, Math.floor((input.outputWidth - renderedImageWidth) / 2));
          imageTop = Math.max(0, Math.floor((input.outputHeight - renderedImageHeight) / 2));
          return sharp(trimmedLogo.data)
            .resize(renderedImageWidth, renderedImageHeight)
            .png({ compressionLevel: 1 })
            .toBuffer();
        })()
        : await baseImagePipeline.clone()
          .png({ compressionLevel: 1 })
          .toBuffer();
    if (!baseImagePipeline) {
      overlays.push({ input: resizedImageBuffer, top: imageTop, left: imageLeft });
    }

    const iconByProvider = new Map<BadgeKey, string | null>();
    const badgesWithIcons = [
      ...input.badges,
      ...input.qualityBadges.filter((badge) => badge.iconUrl),
    ];
    if (badgesWithIcons.length > 0) {
      const iconEntries = await Promise.all(
        badgesWithIcons.map(async (badge) => {
          const isQualityBadge = STREAM_BADGE_META.has(badge.key as StreamBadgeKey);
          const tintColor = isQualityBadge
            ? (['remux', 'bluray', 'webdl', 'webrip', 'dolbyvision', 'hdr10plus', 'hdr10', 'hdr', 'imaxenhanced', 'imax', 'sdr'].includes(badge.key)
              ? 'colored'
              : (input.qualityBadgesColorMode === 'colored' ? (badge.accentColor || '#ffffff') : '#ffffff'))
            : undefined;
          const outputSize = (() => {
            if (isQualityBadge) {
              const streamMeta = STREAM_BADGE_META.get(badge.key as StreamBadgeKey);
              return streamMeta
                ? { width: Math.max(96, Math.round((streamMeta.iconWidthRatio ?? 1) * 96)), height: 96 }
                : { width: 96, height: 96 };
            }
            return { width: 96, height: 96 };
          })();

          const iconDataUri = await getProviderIconDataUri(
            badge.iconUrl,
            badge.iconCornerRadius || 0,
            outputSize,
            tintColor
          );
          return [badge.key, iconDataUri] as const;
        })
      );
      for (const [providerKey, iconDataUri] of iconEntries) {
        iconByProvider.set(providerKey, iconDataUri);
      }
    }

    const badgeHeight = estimateBadgeHeight(
      input.badgeFontSize,
      input.badgePaddingX,
      input.badgePaddingY,
      input.badgeIconSize,
      'standard'
    );
    const verticalBadgeHeight = estimateBadgeHeight(
      input.badgeFontSize,
      input.badgePaddingX,
      input.badgePaddingY,
      input.badgeIconSize,
      input.verticalBadgeContent
    );
    const posterReferenceBadgeHeight =
      usePosterLayout ? input.posterReferenceBadgeHeight ?? badgeHeight : badgeHeight;
    const posterReferenceVerticalBadgeHeight =
      usePosterLayout
        ? input.posterReferenceVerticalBadgeHeight ?? verticalBadgeHeight
        : verticalBadgeHeight;
    const posterReferenceBadgeGap =
      usePosterLayout ? input.posterReferenceBadgeGap ?? input.badgeGap : input.badgeGap;
    const posterReferenceSize = input.backdropAsPoster
      ? Math.min(input.outputWidth, input.outputHeight)
      : input.outputWidth;
    const posterOutputScale = usePosterLayout ? Math.max(1, posterReferenceSize / 500) : 1;
    const posterQualityMaxHeight = Math.round(40 * posterOutputScale);
    const posterQualityMinHeight = Math.round(28 * posterOutputScale);
    const compactPosterRowText =
      usePosterLayout &&
      input.posterRatingsLayout !== 'left' &&
      input.posterRatingsLayout !== 'right' &&
      input.posterRatingsLayout !== 'left-right';
    const posterQualityBadgePlacement =
      usePosterLayout
        ? resolvePosterQualityBadgePlacement(
          input.posterRatingsLayout,
          input.qualityBadgesSide,
          input.posterQualityBadgesPosition
        )
        : null;
    const posterQualityBadgeSidePlacement =
      posterQualityBadgePlacement === 'left' || posterQualityBadgePlacement === 'right'
        ? posterQualityBadgePlacement
        : null;
    const posterRowRegionWidth = Math.max(0, input.outputWidth - input.posterRowHorizontalInset * 2);
    const posterQualitySideBadgeWidth = posterQualityBadgeSidePlacement
      ? Math.min(
        Math.max(72, Math.round(posterReferenceBadgeHeight * 1.75)),
        Math.max(72, input.outputWidth - input.posterRowHorizontalInset * 2)
      )
      : 0;
    const posterSideOverlayGap = Math.max(12, Math.round(posterReferenceBadgeGap * 1.2));
    const posterSideOverlayMaxWidth = posterQualityBadgeSidePlacement
      ? Math.max(
        1,
        input.outputWidth -
        input.posterRowHorizontalInset * 2 -
        posterQualitySideBadgeWidth -
        posterSideOverlayGap
      )
      : posterRowRegionWidth;
    const alignPosterRowWithQuality =
      usePosterLayout && input.qualityBadges.length > 0 && posterQualityBadgeSidePlacement !== null;
    const topRatingsShareRankingRow =
      usePosterLayout &&
      input.rankingBadge != null &&
      input.rankingPosition === 'top' &&
      input.topBadges.length > 0 &&
      (input.posterRatingsLayout === 'top' || input.posterRatingsLayout === 'top-bottom');
    const posterQualityRowAlign: 'left' | 'center' | 'right' = alignPosterRowWithQuality
      ? posterQualityBadgeSidePlacement === 'right'
        ? 'right'
        : 'left'
      : 'center';
    const posterTopRowAlign: 'left' | 'center' | 'right' = topRatingsShareRankingRow
      ? 'right'
      : posterQualityRowAlign;
    const posterBottomRowAlign = posterQualityRowAlign;
    const posterTitleSpec =
      usePosterLayout && input.posterTitleText
        ? buildPosterTitleSvg(input.posterTitleText, posterRowRegionWidth)
        : null;
    const thumbnailFallbackTitleSpec =
      input.imageType === 'thumbnail' &&
        (input.thumbnailFallbackEpisodeCode || input.thumbnailFallbackEpisodeText)
        ? buildThumbnailFallbackTitleSvg(
          input.thumbnailFallbackEpisodeCode || '',
          input.thumbnailFallbackEpisodeText || '',
          Math.min(Math.round(input.outputWidth * 0.62), input.outputWidth - 32)
        )
        : null;
    let posterLogoSpec: { buffer: Buffer; width: number; height: number } | null = null;
    if (usePosterLayout && input.posterLogoUrl) {
      try {
        const logoPayload = await getSourceImagePayload(input.posterLogoUrl);
        const logoBuffer = Buffer.from(logoPayload.body);
        const logoMeta = await sharp(logoBuffer).metadata();
        if (logoMeta.width && logoMeta.height) {
          const maxLogoWidth = Math.min(
            posterRowRegionWidth,
            Math.round(input.outputWidth * 0.78),
            posterSideOverlayMaxWidth
          );
          const maxLogoHeight = Math.max(48, Math.round(input.outputHeight * 0.16));
          const scale = Math.min(
            1,
            maxLogoWidth / logoMeta.width,
            maxLogoHeight / logoMeta.height
          );
          const logoWidth = Math.max(1, Math.round(logoMeta.width * scale));
          const logoHeight = Math.max(1, Math.round(logoMeta.height * scale));
          const resizedLogoBuffer = await sharp(logoBuffer)
            .resize(logoWidth, logoHeight, { fit: 'fill' })
            .png()
            .toBuffer();
          posterLogoSpec = { buffer: resizedLogoBuffer, width: logoWidth, height: logoHeight };
        }
      } catch {
        posterLogoSpec = null;
      }
    }
    const rankingUsesTopBand =
      input.rankingBadge != null &&
      ((input.rankingPosition || 'auto') === 'top' ||
        ((input.rankingPosition || 'auto') === 'auto' && !posterTitleSpec && !posterLogoSpec));
    const hasTopElements = input.topBadges.length > 0 || rankingUsesTopBand;
    const shouldRenderTopBlur = usePosterLayout && (posterTitleSpec || posterLogoSpec) && (input.posterConfiguratorPreset !== 'simple' || hasTopElements);
    if (shouldRenderTopBlur) {
      const blurTopBandHeight = Math.max(110, Math.round(input.outputHeight * 0.22));
      const blurTopHeight = Math.min(input.outputHeight, blurTopBandHeight);
      if (blurTopHeight > 0) {
        // ponytail: blur at half res, then upscale. Identical behind
        // gradients/text, ~6x cheaper (cost scales with pixels x radius^2).
        const halfTopWidth = Math.max(1, Math.floor(input.outputWidth / 2));
        const halfTopHeight = Math.max(1, Math.floor(blurTopHeight / 2));
        const blurredTop = await sharp(resizedImageBuffer)
          .extract({ left: 0, top: 0, width: input.outputWidth, height: blurTopHeight })
          .resize(halfTopWidth, halfTopHeight)
          .blur(8)
          .resize(input.outputWidth, blurTopHeight)
          .composite([
            {
              input: Buffer.from(
                `<svg xmlns="http://www.w3.org/2000/svg" width="${input.outputWidth}" height="${blurTopHeight}" viewBox="0 0 ${input.outputWidth} ${blurTopHeight}">
                  <defs>
                    <linearGradient id="poster-top-darken" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stop-color="#000000" stop-opacity="0.62"/>
                      <stop offset="0.55" stop-color="#000000" stop-opacity="0.22"/>
                      <stop offset="1" stop-color="#000000" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#poster-top-darken)"/>
                </svg>`
              ),
            },
            {
              input: Buffer.from(
                `<svg xmlns="http://www.w3.org/2000/svg" width="${input.outputWidth}" height="${blurTopHeight}" viewBox="0 0 ${input.outputWidth} ${blurTopHeight}">
                  <defs>
                    <linearGradient id="poster-top-blur-mask" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stop-color="black" stop-opacity="0.92"/>
                      <stop offset="0.48" stop-color="black" stop-opacity="0.62"/>
                      <stop offset="1" stop-color="black" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#poster-top-blur-mask)"/>
                </svg>`
              ),
              blend: 'dest-in',
            },
          ])
          .png({ compressionLevel: 1 })
          .toBuffer();
        overlays.push({ input: blurredTop, top: 0, left: 0 });
      }
      const blurBandHeight = Math.max(180, Math.round(input.outputHeight / 3));
      const blurTop = Math.max(0, input.outputHeight - blurBandHeight);
      const blurHeight = Math.min(input.outputHeight - blurTop, blurBandHeight);
      if (blurHeight > 0) {
        const halfBottomWidth = Math.max(1, Math.floor(input.outputWidth / 2));
        const halfBottomHeight = Math.max(1, Math.floor(blurHeight / 2));
        const blurredBottom = await sharp(resizedImageBuffer)
          .extract({ left: 0, top: blurTop, width: input.outputWidth, height: blurHeight })
          .resize(halfBottomWidth, halfBottomHeight)
          .blur(9)
          .resize(input.outputWidth, blurHeight)
          .composite([
            {
              input: Buffer.from(
                `<svg xmlns="http://www.w3.org/2000/svg" width="${input.outputWidth}" height="${blurHeight}" viewBox="0 0 ${input.outputWidth} ${blurHeight}">
                  <defs>
                    <linearGradient id="poster-bottom-darken" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stop-color="#000000" stop-opacity="0"/>
                      <stop offset="0.42" stop-color="#000000" stop-opacity="0.28"/>
                      <stop offset="1" stop-color="#000000" stop-opacity="0.66"/>
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#poster-bottom-darken)"/>
                </svg>`
              ),
            },
            {
              input: Buffer.from(
                `<svg xmlns="http://www.w3.org/2000/svg" width="${input.outputWidth}" height="${blurHeight}" viewBox="0 0 ${input.outputWidth} ${blurHeight}">
                  <defs>
                    <linearGradient id="poster-bottom-blur-mask" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stop-color="black" stop-opacity="0"/>
                      <stop offset="0.28" stop-color="black" stop-opacity="0.45"/>
                      <stop offset="0.62" stop-color="black" stop-opacity="0.82"/>
                      <stop offset="1" stop-color="black" stop-opacity="0.96"/>
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#poster-bottom-blur-mask)"/>
                </svg>`
              ),
              blend: 'dest-in',
            },
          ])
          .png({ compressionLevel: 1 })
          .toBuffer();
        overlays.push({ input: blurredBottom, top: blurTop, left: 0 });
      }
    }

    if (usePosterLayout && input.posterVignetteEnabled !== false) {
      const vignetteSvg = `<svg width="${input.outputWidth}" height="${input.finalOutputHeight}">
        <defs>
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
            <stop offset="0%" stop-color="black" stop-opacity="0" />
            <stop offset="40%" stop-color="black" stop-opacity="0" />
            <stop offset="100%" stop-color="black" stop-opacity="0.85" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#vignette)" />
      </svg>`;
      overlays.push({ input: Buffer.from(vignetteSvg), top: 0, left: 0 });
    }
    const posterBlockingRects: OverlayRect[] = [];
    const addPosterBlockingRect = (left: number, top: number, width: number, height: number) => {
      if (!usePosterLayout || width <= 0 || height <= 0) return;
      posterBlockingRects.push({
        left: Math.round(left),
        top: Math.round(top),
        width: Math.round(width),
        height: Math.round(height),
      });
    };
    let lastTopBadgeRowLeft = 0;
    let lastTopBadgeRowRight = 0;
    let lastTopBadgeRowTop = 0;
    let lastTopBadgeRowBottom = 0;
    const rememberTopBadgeRow = (rowBadges: RatingBadge[], left: number, width: number, top: number, height: number) => {
      if (!usePosterLayout || rowBadges !== input.topBadges || width <= 0 || height <= 0) return;
      lastTopBadgeRowLeft = left;
      lastTopBadgeRowRight = left + width;
      lastTopBadgeRowTop = top;
      lastTopBadgeRowBottom = top + height;
    };
    const composeBadgeRow = (
      rowBadges: RatingBadge[],
      rowY: number,
      options?: {
        maxRowWidth?: number;
        regionLeft?: number;
        regionWidth?: number;
        align?: 'left' | 'center' | 'right';
        splitAcrossHalves?: boolean;
        spreadAcrossThirds?: boolean;
        preserveBadgeSize?: boolean;
        contentLayoutOverride?: 'standard' | 'stacked';
        compactTextOverride?: boolean;
      }
    ) => {
      if (rowBadges.length === 0) return;
      const rowContentLayout = options?.contentLayoutOverride ?? input.verticalBadgeContent;
      const rowCompactText = options?.compactTextOverride ?? compactPosterRowText;
      const rowBadgeHeight = estimateBadgeHeight(
        options?.preserveBadgeSize && input.qualityBadgeFontSize ? input.qualityBadgeFontSize : input.badgeFontSize,
        options?.preserveBadgeSize && input.qualityBadgePaddingX ? input.qualityBadgePaddingX : input.badgePaddingX,
        options?.preserveBadgeSize && input.qualityBadgePaddingY ? input.qualityBadgePaddingY : input.badgePaddingY,
        options?.preserveBadgeSize && input.qualityBadgeIconSize ? input.qualityBadgeIconSize : input.badgeIconSize,
        rowContentLayout
      );
      const rowEntries = rowBadges.map((badge) => {
        const effectiveIconSize = options?.preserveBadgeSize && input.qualityBadgeIconSize ? input.qualityBadgeIconSize : input.badgeIconSize;
        const effectiveGap = options?.preserveBadgeSize && input.qualityBadgeGap ? input.qualityBadgeGap : input.badgeGap;
        const badgeIconSize = badge.key === 'average' ? 0 : effectiveIconSize;
        const badgeGap = badge.key === 'average' ? 0 : effectiveGap;
        const badgeWidth = estimateBadgeWidth(
          badge.value,
          options?.preserveBadgeSize && input.qualityBadgeFontSize ? input.qualityBadgeFontSize : input.badgeFontSize,
          options?.preserveBadgeSize && input.qualityBadgePaddingX ? input.qualityBadgePaddingX : input.badgePaddingX,
          badgeIconSize,
          badgeGap,
          rowCompactText,
          rowContentLayout
        );
        const minBadgeWidth = getMinimumCompressedBadgeWidth(
          badge.value,
          options?.preserveBadgeSize && input.qualityBadgeFontSize ? input.qualityBadgeFontSize : input.badgeFontSize,
          options?.preserveBadgeSize && input.qualityBadgePaddingX ? input.qualityBadgePaddingX : input.badgePaddingX,
          badgeIconSize,
          badgeGap,
          rowCompactText,
          rowContentLayout
        );
        return { badge, badgeWidth, minBadgeWidth };
      });
      const regionLeft = Math.max(0, Math.floor(options?.regionLeft ?? 0));
      const regionWidth = Math.max(0, Math.floor(options?.regionWidth ?? input.outputWidth));
      const regionRight = Math.min(input.outputWidth, regionLeft + regionWidth);
      const effectiveMaxWidth =
        typeof options?.maxRowWidth === 'number'
          ? Math.min(options.maxRowWidth, Math.max(0, regionWidth - 24))
          : Math.max(0, regionWidth - 24);
      let rowGap = input.badgeGap;
      const measureCurrentRowWidth = () =>
        rowEntries.reduce((acc, entry) => acc + entry.badgeWidth, 0) +
        Math.max(0, rowEntries.length - 1) * rowGap;
      let rowWidth = measureCurrentRowWidth();
      if (!options?.preserveBadgeSize && rowWidth > effectiveMaxWidth && rowEntries.length > 1 && rowGap > 0) {
        const shrinkPerGap = Math.min(
          rowGap,
          Math.max(1, Math.ceil((rowWidth - effectiveMaxWidth) / (rowEntries.length - 1)))
        );
        rowGap = Math.max(0, rowGap - shrinkPerGap);
        rowWidth = measureCurrentRowWidth();
      }
      if (!options?.preserveBadgeSize && rowWidth > effectiveMaxWidth) {
        let overflow = rowWidth - effectiveMaxWidth;
        let guard = 0;
        while (overflow > 0 && guard < rowEntries.length * 8) {
          let changed = false;
          for (const entry of rowEntries) {
            if (overflow <= 0) break;
            const shrinkable = Math.max(0, entry.badgeWidth - entry.minBadgeWidth);
            if (shrinkable <= 0) continue;
            const shrink = Math.min(shrinkable, Math.max(1, Math.ceil(overflow / rowEntries.length)));
            entry.badgeWidth -= shrink;
            overflow -= shrink;
            changed = true;
          }
          if (!changed) break;
          rowWidth = measureCurrentRowWidth();
          overflow = Math.max(0, rowWidth - effectiveMaxWidth);
          guard += 1;
        }
        rowWidth = measureCurrentRowWidth();
      }
      const isPosterRowLayout =
        usePosterLayout &&
        (input.posterRatingsLayout === 'top' ||
          input.posterRatingsLayout === 'bottom' ||
          input.posterRatingsLayout === 'top-bottom');
      const shouldCenterSingle = isPosterRowLayout && rowEntries.length === 1;
      const shouldSplitRow =
        (isPosterRowLayout || options?.splitAcrossHalves === true) && rowEntries.length === 2;
      const shouldSpreadRow =
        (isPosterRowLayout || options?.spreadAcrossThirds === true) && rowEntries.length === 3;
      if (shouldCenterSingle) {
        const singleAlign = options?.align || 'center';
        const centerX =
          singleAlign === 'right'
            ? regionRight - rowEntries[0].badgeWidth - 12
            : singleAlign === 'left'
              ? regionLeft + 12
              : regionLeft + Math.floor(regionWidth / 2) - Math.floor(rowEntries[0].badgeWidth / 2);
        const clampedX = Math.max(
          regionLeft,
          Math.min(centerX, Math.max(regionLeft, regionRight - rowEntries[0].badgeWidth))
        );
        const entry = rowEntries[0];
        const monogram = buildProviderMonogram(
          entry.badge.label || String(entry.badge.key).toUpperCase()
        );
        const badgeSvg = buildBadgeSvg({
          width: entry.badgeWidth,
          height: rowBadgeHeight,
          iconSize: input.badgeIconSize,
          fontSize: input.badgeFontSize,
          paddingX: input.badgePaddingX,
          gap: input.badgeGap,
          accentColor: entry.badge.accentColor,
          monogram: entry.badge.key === 'average' ? '' : monogram,
          iconDataUri: iconByProvider.get(entry.badge.key) || null,
          iconCornerRadius: entry.badge.iconCornerRadius,
          iconScale: entry.badge.iconScale,
          value: entry.badge.value,
          ratingStyle: input.ratingStyle,
          ratingsColorMode: input.ratingsColorMode,
          compactText: rowCompactText,
          contentLayout: rowContentLayout,
        });
        overlays.push({ input: Buffer.from(badgeSvg), top: rowY, left: clampedX });
        addPosterBlockingRect(clampedX, rowY, entry.badgeWidth, rowBadgeHeight);
        rememberTopBadgeRow(rowBadges, clampedX, entry.badgeWidth, rowY, rowBadgeHeight);
        return;
      }
      if (shouldSplitRow) {
        const edgeInset = 12;
        const leftHalfWidth = Math.floor(regionWidth / 2);
        const rightHalfWidth = Math.max(0, regionWidth - leftHalfWidth);
        const leftMin = regionLeft + edgeInset;
        const leftMax = regionLeft + leftHalfWidth - edgeInset - rowEntries[0].badgeWidth;
        const rightMin = regionLeft + leftHalfWidth + edgeInset;
        const rightMax = regionRight - edgeInset - rowEntries[1].badgeWidth;
        if (leftMin <= leftMax && rightMin <= rightMax) {
          const leftCenterX =
            regionLeft + Math.floor(leftHalfWidth / 2) - Math.floor(rowEntries[0].badgeWidth / 2);
          const rightCenterX =
            regionLeft +
            leftHalfWidth +
            Math.floor(rightHalfWidth / 2) -
            Math.floor(rowEntries[1].badgeWidth / 2);
          const leftX = Math.max(leftMin, Math.min(leftCenterX, leftMax));
          const rightX = Math.max(rightMin, Math.min(rightCenterX, rightMax));
          const overlaps = leftX + rowEntries[0].badgeWidth + rowGap > rightX;
          if (!overlaps) {
            const positions = [leftX, rightX];
            for (let index = 0; index < rowEntries.length; index += 1) {
              const entry = rowEntries[index];
              const monogram = buildProviderMonogram(
                entry.badge.label || String(entry.badge.key).toUpperCase()
              );
              const badgeSvg = buildBadgeSvg({
                width: entry.badgeWidth,
                height: rowBadgeHeight,
                iconSize: options?.preserveBadgeSize && input.qualityBadgeIconSize ? input.qualityBadgeIconSize : input.badgeIconSize,
                fontSize: options?.preserveBadgeSize && input.qualityBadgeFontSize ? input.qualityBadgeFontSize : input.badgeFontSize,
                paddingX: options?.preserveBadgeSize && input.qualityBadgePaddingX ? input.qualityBadgePaddingX : input.badgePaddingX,
                gap: options?.preserveBadgeSize && input.qualityBadgeGap ? input.qualityBadgeGap : input.badgeGap,
                accentColor: entry.badge.accentColor,
                monogram: entry.badge.key === 'average' ? '' : monogram,
                iconDataUri: iconByProvider.get(entry.badge.key) || null,
                iconCornerRadius: entry.badge.iconCornerRadius,
                iconScale: entry.badge.iconScale,
                value: entry.badge.value,
          ratingStyle: input.ratingStyle,
          ratingsColorMode: input.ratingsColorMode,
                compactText: rowCompactText,
                contentLayout: rowContentLayout,
              });
              overlays.push({ input: Buffer.from(badgeSvg), top: rowY, left: positions[index] });
              addPosterBlockingRect(positions[index], rowY, entry.badgeWidth, rowBadgeHeight);
            }
            rememberTopBadgeRow(
              rowBadges,
              positions[0],
              positions[positions.length - 1] + rowEntries[rowEntries.length - 1].badgeWidth - positions[0],
              rowY,
              rowBadgeHeight
            );
            return;
          }
        }
      }
      if (shouldSpreadRow) {
        const edgeInset = 12;
        const leftX = regionLeft + edgeInset;
        const centerX = regionLeft + Math.floor(regionWidth / 2) - Math.floor(rowEntries[1].badgeWidth / 2);
        const rightX = Math.max(regionLeft, regionRight - rowEntries[2].badgeWidth - edgeInset);
        const overlaps =
          leftX + rowEntries[0].badgeWidth + rowGap > centerX ||
          centerX + rowEntries[1].badgeWidth + rowGap > rightX;
        if (!overlaps) {
          const positions = [leftX, centerX, rightX];
          for (let index = 0; index < rowEntries.length; index += 1) {
            const entry = rowEntries[index];
            const monogram = buildProviderMonogram(
              entry.badge.label || String(entry.badge.key).toUpperCase()
            );
            const badgeSvg = buildBadgeSvg({
              width: entry.badgeWidth,
              height: rowBadgeHeight,
              iconSize: input.badgeIconSize,
              fontSize: input.badgeFontSize,
              paddingX: input.badgePaddingX,
              gap: input.badgeGap,
              accentColor: entry.badge.accentColor,
              monogram: entry.badge.key === 'average' ? '' : monogram,
              iconDataUri: iconByProvider.get(entry.badge.key) || null,
              iconCornerRadius: entry.badge.iconCornerRadius,
              iconScale: entry.badge.iconScale,
              value: entry.badge.value,
              ratingStyle: input.ratingStyle,
              ratingsColorMode: input.ratingsColorMode,
              compactText: rowCompactText,
              contentLayout: rowContentLayout,
            });
            overlays.push({ input: Buffer.from(badgeSvg), top: rowY, left: positions[index] });
            addPosterBlockingRect(positions[index], rowY, entry.badgeWidth, rowBadgeHeight);
          }
          rememberTopBadgeRow(
            rowBadges,
            positions[0],
            positions[positions.length - 1] + rowEntries[rowEntries.length - 1].badgeWidth - positions[0],
            rowY,
            rowBadgeHeight
          );
          return;
        }
      }
      const align = options?.align || 'center';
      const preferredEdgeInset = 12;
      const dynamicEdgeInset =
        rowWidth > effectiveMaxWidth
          ? Math.max(0, Math.min(preferredEdgeInset, Math.floor((regionWidth - rowWidth) / 2)))
          : preferredEdgeInset;
      const minRowX = regionLeft + dynamicEdgeInset;
      const maxRowX = Math.max(regionLeft, regionRight - rowWidth - dynamicEdgeInset);
      let rowX =
        align === 'left'
          ? minRowX
          : align === 'right'
            ? maxRowX
            : regionLeft + Math.floor((regionWidth - rowWidth) / 2);
      if (rowWidth > effectiveMaxWidth) {
        rowX =
          align === 'right'
            ? Math.max(regionLeft, regionRight - rowWidth)
            : align === 'left'
              ? regionLeft
              : regionLeft + Math.floor((regionWidth - rowWidth) / 2);
      }
      rowX = Math.max(regionLeft, Math.min(rowX, Math.max(regionLeft, regionRight - rowWidth)));
      const composedRowStartX = rowX;

      for (const entry of rowEntries) {
        const monogram = buildProviderMonogram(
          entry.badge.label || String(entry.badge.key).toUpperCase()
        );
        const badgeSvg = buildBadgeSvg({
          width: entry.badgeWidth,
          height: rowBadgeHeight,
          iconSize: input.badgeIconSize,
          fontSize: input.badgeFontSize,
          paddingX: input.badgePaddingX,
          gap: input.badgeGap,
          accentColor: entry.badge.accentColor,
          monogram: entry.badge.key === 'average' ? '' : monogram,
          iconDataUri: iconByProvider.get(entry.badge.key) || null,
          iconCornerRadius: entry.badge.iconCornerRadius,
          iconScale: entry.badge.iconScale,
          value: entry.badge.value,
          ratingStyle: input.ratingStyle,
          ratingsColorMode: input.ratingsColorMode,
          compactText: rowCompactText,
          contentLayout: rowContentLayout,
        });
        overlays.push({ input: Buffer.from(badgeSvg), top: rowY, left: rowX });
        addPosterBlockingRect(rowX, rowY, entry.badgeWidth, rowBadgeHeight);
        rowX += entry.badgeWidth + rowGap;
      }
      rememberTopBadgeRow(rowBadges, composedRowStartX, rowWidth, rowY, rowBadgeHeight);
    };
    let lastOverlayTopY = 0;
    let lastOverlayBottomY = 0;
    let lastOverlayAnchorY = 0;
    let lastPosterQualityTopY = 0;
    let lastPosterQualityBottomY = 0;
    let lastPosterQualityRowLeft = 0;
    let lastPosterQualityRowRight = 0;
    let lastPosterQualityPlacement = '';
    let rankingPlacedSameRowAsQuality = false;
    let lastRankingRowLeft = 0;
    let lastRankingRowRight = 0;
    let lastRankingRowTopY = 0;
    let lastRankingRowBottomY = 0;
    let lastRankingPlacement = '';
    let rankingSharesGenreRow = false;
    let posterGenreBadgeComposed = false;
    const composePosterCleanOverlayAboveBottom = () => {
      if (!usePosterLayout) return;
      const overlay = posterLogoSpec
        ? {
          buffer: posterLogoSpec.buffer,
          width: posterLogoSpec.width,
          height: posterLogoSpec.height,
        }
        : posterTitleSpec
          ? {
            buffer: Buffer.from(posterTitleSpec.svg),
            width: posterTitleSpec.width,
            height: posterTitleSpec.height,
          }
          : null;
      if (!overlay && !input.posterCleanOverlayEnabled) return;
      const baseOverlayGap = Math.max(16, Math.round(posterReferenceBadgeGap * 1.4));
      const overlayGap = input.posterConfiguratorPreset === 'advanced' ? baseOverlayGap + 12 : baseOverlayGap;
      const stableBottomAnchorY = Math.max(
        input.badgeTopOffset,
        input.outputHeight - input.badgeBottomOffset - posterReferenceBadgeHeight
      );
      const overlayAnchorY = stableBottomAnchorY;
      const overlayWidth = overlay?.width ?? Math.max(1, input.outputWidth - input.posterRowHorizontalInset * 2);
      const overlayHeight = overlay?.height ?? Math.max(96, Math.round(input.outputHeight * 0.18));
      let overlayY = Math.round(overlayAnchorY - overlayGap - overlayHeight);
      const topRowBottom =
        input.topBadges.length > 0
          ? input.badgeTopOffset + Math.max(badgeHeight, posterReferenceBadgeHeight) + posterReferenceBadgeGap
          : input.badgeTopOffset;
      if (overlayY < topRowBottom) {
        overlayY = topRowBottom;
      }
      if (overlayY + overlayHeight + overlayGap > overlayAnchorY) {
        return;
      }
      const reservePad = Math.max(8, Math.round(posterReferenceBadgeGap * 0.9));
      const overlayInset = input.posterRowHorizontalInset;
      const centeredOverlayX = Math.max(
        overlayInset,
        Math.round((input.outputWidth - overlayWidth) / 2)
      );
      const sideOverlayX = posterQualityBadgeSidePlacement === 'right'
        ? overlayInset
        : posterQualityBadgeSidePlacement === 'left'
          ? Math.max(overlayInset, input.outputWidth - overlayWidth - overlayInset)
          : centeredOverlayX;
      const reservedQualitySideRect =
        input.qualityBadges.length > 0 && posterQualityBadgeSidePlacement
          ? {
            left: posterQualityBadgeSidePlacement === 'right'
              ? input.outputWidth - posterQualitySideBadgeWidth - overlayInset
              : overlayInset,
            top: input.badgeTopOffset,
            width: posterQualitySideBadgeWidth,
            height: Math.max(0, input.outputHeight - input.badgeTopOffset - input.badgeBottomOffset),
          }
          : null;
      const overlayCandidates = [
        sideOverlayX,
        centeredOverlayX,
        overlayInset,
        Math.max(overlayInset, input.outputWidth - overlayWidth - overlayInset),
      ].filter((left, index, values) => values.indexOf(left) === index);
      const selectedOverlay = findFirstNonOverlappingRect(
        overlayCandidates.map((left) => ({ left, top: overlayY, width: overlayWidth, height: overlayHeight })),
        reservedQualitySideRect ? [...posterBlockingRects, reservedQualitySideRect] : posterBlockingRects,
        0
      );
      if (!selectedOverlay) {
        warnCollision('Poster clean overlay could not avoid collision');
        return;
      }
      const overlayX = selectedOverlay.left;
      if (overlay) {
        overlays.push({ input: overlay.buffer, top: overlayY, left: overlayX });
      }
      addPosterBlockingRect(
        Math.max(0, overlayX - reservePad),
        Math.max(input.badgeTopOffset, overlayY - reservePad),
        Math.min(input.outputWidth, overlayWidth + reservePad * 2),
        overlayHeight + reservePad * 2
      );
      lastOverlayTopY = overlayY;
      lastOverlayBottomY = overlayY + overlayHeight;
      lastOverlayAnchorY = overlayAnchorY;
    };
    const composeThumbnailFallbackOverlay = () => {
      if (input.imageType !== 'thumbnail' || !thumbnailFallbackTitleSpec) return;
      const bottomInset = Math.max(16, input.badgeBottomOffset);
      const leftInset = 16;
      const overlayX = Math.max(
        leftInset,
        Math.min(leftInset, Math.max(leftInset, input.outputWidth - thumbnailFallbackTitleSpec.width - leftInset))
      );
      const overlayY = Math.max(
        16,
        input.outputHeight - thumbnailFallbackTitleSpec.height - bottomInset
      );
      overlays.push({
        input: Buffer.from(thumbnailFallbackTitleSpec.svg),
        top: overlayY,
        left: overlayX,
      });
    };
    const composePosterBadgeAt = (
      badge: RatingBadge,
      left: number,
      top: number,
      maxBadgeWidth: number,
      contentLayout: 'standard' | 'stacked' = input.verticalBadgeContent
    ) => {
      const isAverage = badge.key === 'average';
      const effectiveIconSize = isAverage || input.qualityBadgeIconSize ? (input.qualityBadgeIconSize || 46) : input.badgeIconSize;
      const effectiveFontSize = isAverage && input.qualityBadgeFontSize ? input.qualityBadgeFontSize : input.badgeFontSize;
      const effectivePaddingX = isAverage && input.qualityBadgePaddingX ? input.qualityBadgePaddingX : input.badgePaddingX;
      const effectivePaddingY = isAverage && input.qualityBadgePaddingY ? input.qualityBadgePaddingY : input.badgePaddingY;
      const effectiveGap = isAverage && input.qualityBadgeGap ? input.qualityBadgeGap : input.badgeGap;

      const badgeHeightForLayout = estimateBadgeHeight(
        effectiveFontSize,
        effectivePaddingX,
        effectivePaddingY,
        effectiveIconSize,
        contentLayout
      );
      const estimatedWidth = estimateBadgeWidth(
        badge.value,
        effectiveFontSize,
        effectivePaddingX,
        effectiveIconSize,
        effectiveGap,
        false,
        contentLayout
      );
      const badgeWidth = Math.min(estimatedWidth, maxBadgeWidth);
      const monogram = buildProviderMonogram(
        badge.label || String(badge.key).toUpperCase()
      );
      const badgeSvg = buildBadgeSvg({
        width: badgeWidth,
        height: badgeHeightForLayout,
        iconSize: effectiveIconSize,
        fontSize: effectiveFontSize,
        paddingX: effectivePaddingX,
        gap: effectiveGap,
        accentColor: badge.accentColor,
        monogram: badge.key === 'average' ? '' : monogram,
        iconDataUri: iconByProvider.get(badge.key) || null,
        iconCornerRadius: badge.iconCornerRadius,
        iconScale: badge.iconScale,
        value: badge.value,
        ratingStyle: input.ratingStyle,
        ratingsColorMode: input.ratingsColorMode,
        contentLayout,
      });
      overlays.push({ input: Buffer.from(badgeSvg), top, left });
      addPosterBlockingRect(left, top, badgeWidth, badgeHeightForLayout);
      return { width: badgeWidth, height: badgeHeightForLayout };
    };
    const composePosterCenteredTopBadge = (
      badge: RatingBadge,
      sizeMode: 'default' | 'top' = 'default'
    ) => {
      if (sizeMode === 'top') {
        const topIconSize = input.qualityBadgeIconSize ?? input.badgeIconSize;
        const topFontSize = input.qualityBadgeFontSize ?? input.badgeFontSize;
        const topPaddingX = input.qualityBadgePaddingX ?? input.badgePaddingX;
        const topPaddingY = input.qualityBadgePaddingY ?? input.badgePaddingY;
        const topGap = input.qualityBadgeGap ?? input.badgeGap;
        const topBadgeHeight = estimateBadgeHeight(
          topFontSize,
          topPaddingX,
          topPaddingY,
          topIconSize,
          'standard'
        );
        const estimatedWidth = estimateBadgeWidth(
          badge.value,
          topFontSize,
          topPaddingX,
          topIconSize,
          topGap,
          true,
          'standard'
        );
        const badgeWidth = Math.min(estimatedWidth, Math.max(0, posterRowRegionWidth - 24));
        const rowX = Math.max(
          input.posterRowHorizontalInset,
          input.posterRowHorizontalInset + Math.floor((posterRowRegionWidth - badgeWidth) / 2)
        );
        const monogram = buildProviderMonogram(
          badge.label || String(badge.key).toUpperCase()
        );
        const badgeSvg = buildBadgeSvg({
          width: badgeWidth,
          height: topBadgeHeight,
          iconSize: topIconSize,
          fontSize: topFontSize,
          paddingX: topPaddingX,
          gap: topGap,
          accentColor: badge.accentColor,
          monogram: badge.key === 'average' ? '' : monogram,
          iconDataUri: iconByProvider.get(badge.key) || null,
          iconCornerRadius: badge.iconCornerRadius,
          iconScale: badge.iconScale,
          value: badge.value,
          ratingStyle: input.ratingStyle,
          ratingsColorMode: input.ratingsColorMode,
          compactText: true,
          contentLayout: 'standard',
        });
        overlays.push({ input: Buffer.from(badgeSvg), top: input.badgeTopOffset, left: rowX });
        addPosterBlockingRect(rowX, input.badgeTopOffset, badgeWidth, topBadgeHeight);
        return;
      }

      composeBadgeRow([badge], input.badgeTopOffset, {
        regionLeft: input.posterRowHorizontalInset,
        regionWidth: posterRowRegionWidth,
        align: 'center',
        preserveBadgeSize: true,
        contentLayoutOverride: 'standard',
        compactTextOverride: true,
      });
    };
    const composeEdgeAlignedPosterBadge = (
      badge: RatingBadge,
      rowY: number,
      side: 'left' | 'right',
      maxBadgeWidth: number
    ) => {
      const isAverage = badge.key === 'average';
      const effectiveIconSize = isAverage || input.qualityBadgeIconSize ? (input.qualityBadgeIconSize || 46) : input.badgeIconSize;
      const effectiveFontSize = isAverage && input.qualityBadgeFontSize ? input.qualityBadgeFontSize : input.badgeFontSize;
      const effectivePaddingX = isAverage && input.qualityBadgePaddingX ? input.qualityBadgePaddingX : input.badgePaddingX;
      const effectiveGap = isAverage && input.qualityBadgeGap ? input.qualityBadgeGap : input.badgeGap;

      const estimatedWidth = estimateBadgeWidth(
        badge.value,
        effectiveFontSize,
        effectivePaddingX,
        effectiveIconSize,
        effectiveGap,
        false,
        input.verticalBadgeContent
      );
      const badgeWidth = Math.min(estimatedWidth, maxBadgeWidth);
      const rowInset = input.posterRowHorizontalInset;
      const rowX =
        side === 'left'
          ? rowInset
          : Math.max(rowInset, input.outputWidth - badgeWidth - rowInset);
      composePosterBadgeAt(badge, rowX, rowY, maxBadgeWidth, input.verticalBadgeContent);
    };
    const composeBadgeColumn = (
      columnBadges: RatingBadge[],
      side: 'left' | 'right',
      maxBadgeWidth: number,
      origin: 'top' | 'bottom' = 'top',
      startY?: number
    ) => {
      if (columnBadges.length === 0) return;
      let rowY =
        typeof startY === 'number'
          ? Math.max(input.badgeTopOffset, startY)
          : origin === 'bottom'
            ? Math.max(input.badgeTopOffset, input.outputHeight - input.badgeBottomOffset - verticalBadgeHeight)
            : input.badgeTopOffset;
      for (let index = 0; index < columnBadges.length; index += 1) {
        const badge = columnBadges[index];
        composeEdgeAlignedPosterBadge(badge, rowY, side, maxBadgeWidth);
        rowY += origin === 'bottom' ? -(verticalBadgeHeight + input.badgeGap) : verticalBadgeHeight + input.badgeGap;
      }
    };
    const composeBackdropBadgeColumn = (
      columnBadges: RatingBadge[],
      placement: BackdropBadgePlacement,
      maxBadgeWidth: number,
      startY?: number
    ) => {
      if (columnBadges.length === 0) return;
      const columnHeight =
        columnBadges.length * verticalBadgeHeight + Math.max(0, columnBadges.length - 1) * input.badgeGap;
      let rowY =
        typeof startY === 'number'
          ? Math.max(input.badgeTopOffset, startY)
          : placement.vertical === 'bottom'
            ? Math.max(input.badgeTopOffset, input.outputHeight - input.badgeBottomOffset - columnHeight)
            : placement.vertical === 'center'
              ? Math.max(
                input.badgeTopOffset,
                Math.round((input.outputHeight - columnHeight) / 2)
              )
              : input.badgeTopOffset;
      const regionLeft = placement.left;
      const regionRight = placement.left + placement.width;
      for (const badge of columnBadges) {
        const estimatedWidth = estimateBadgeWidth(
          badge.value,
          input.badgeFontSize,
          input.badgePaddingX,
          input.badgeIconSize,
          input.badgeGap,
          false,
          input.verticalBadgeContent
        );
        const badgeWidth = Math.min(estimatedWidth, maxBadgeWidth);
        const rowX =
          placement.align === 'left'
            ? regionLeft
            : placement.align === 'right'
              ? Math.max(regionLeft, regionRight - badgeWidth)
              : Math.max(regionLeft, Math.round(regionLeft + (placement.width - badgeWidth) / 2));
        const monogram = buildProviderMonogram(
          badge.label || String(badge.key).toUpperCase()
        );
        const badgeSvg = buildBadgeSvg({
          width: badgeWidth,
          height: verticalBadgeHeight,
          iconSize: input.badgeIconSize,
          fontSize: input.badgeFontSize,
          paddingX: input.badgePaddingX,
          gap: input.badgeGap,
          accentColor: badge.accentColor,
          monogram: badge.key === 'average' ? '' : monogram,
          iconDataUri: iconByProvider.get(badge.key) || null,
          iconCornerRadius: badge.iconCornerRadius,
          iconScale: badge.iconScale,
          value: badge.value,
          ratingStyle: input.ratingStyle,
          ratingsColorMode: input.ratingsColorMode,
          contentLayout: input.verticalBadgeContent,
        });
        overlays.push({ input: Buffer.from(badgeSvg), top: rowY, left: rowX });
        rowY += verticalBadgeHeight + input.badgeGap;
      }
    };
    const composeBackdropBadgeColumns = (
      columns: RatingBadge[][],
      placement: BackdropBadgePlacement
    ) => {
      const usableColumns = columns.filter((column) => column.length > 0);
      if (usableColumns.length === 0) return false;
      const estimatedColumns = usableColumns.map((columnBadges) => {
        const widths = columnBadges.map((badge) =>
          estimateBadgeWidth(
            badge.value,
            input.badgeFontSize,
            input.badgePaddingX,
            input.badgeIconSize,
            input.badgeGap,
            false,
            input.verticalBadgeContent
          )
        );
        return {
          badges: columnBadges,
          badgeWidths: widths,
          maxWidth: Math.max(0, ...widths),
          height:
            columnBadges.length * verticalBadgeHeight +
            Math.max(0, columnBadges.length - 1) * input.badgeGap,
        };
      });
      const columnGap = Math.max(12, input.badgeGap);
      const totalWidth =
        estimatedColumns.reduce((sum, column) => sum + column.maxWidth, 0) +
        Math.max(0, estimatedColumns.length - 1) * columnGap;
      const regionLeft = placement.left;
      const regionRight = placement.left + placement.width;
      if (totalWidth > placement.width) return false;

      const startX =
        placement.align === 'right'
          ? regionRight - totalWidth
          : placement.align === 'center'
            ? regionLeft + Math.floor((placement.width - totalWidth) / 2)
            : regionLeft;
      if (startX < regionLeft || startX + totalWidth > regionRight) return false;

      const tallestHeight = estimatedColumns.reduce(
        (maxHeight, column) => Math.max(maxHeight, column.height),
        0
      );
      const startY =
        placement.vertical === 'bottom'
          ? Math.max(input.badgeTopOffset, input.outputHeight - input.badgeBottomOffset - tallestHeight)
          : placement.vertical === 'center'
            ? Math.max(input.badgeTopOffset, Math.round((input.outputHeight - tallestHeight) / 2))
            : input.badgeTopOffset;

      let columnX = startX;
      for (const column of estimatedColumns) {
        let rowY = startY;
        for (let index = 0; index < column.badges.length; index += 1) {
          const badge = column.badges[index];
          const badgeWidth = column.badgeWidths[index];
          const rowX = columnX + Math.floor((column.maxWidth - badgeWidth) / 2);
          const monogram = buildProviderMonogram(
            badge.label || String(badge.key).toUpperCase()
          );
          const badgeSvg = buildBadgeSvg({
            width: badgeWidth,
            height: verticalBadgeHeight,
            iconSize: input.badgeIconSize,
            fontSize: input.badgeFontSize,
            paddingX: input.badgePaddingX,
            gap: input.badgeGap,
            accentColor: badge.accentColor,
            monogram: badge.key === 'average' ? '' : monogram,
            iconDataUri: iconByProvider.get(badge.key) || null,
            iconCornerRadius: badge.iconCornerRadius,
            iconScale: badge.iconScale,
            value: badge.value,
            ratingStyle: input.ratingStyle,
            ratingsColorMode: input.ratingsColorMode,
            contentLayout: input.verticalBadgeContent,
          });
          overlays.push({ input: Buffer.from(badgeSvg), top: rowY, left: rowX });
          rowY += verticalBadgeHeight + input.badgeGap;
        }
        columnX += column.maxWidth + columnGap;
      }

      return true;
    };
    const composeQualityBadgeColumn = (
      columnBadges: RatingBadge[],
      startY: number,
      side: QualityBadgesSide
    ) => {
      if (columnBadges.length === 0) return;
      const qualityBaseHeight =
        usePosterLayout ? posterReferenceBadgeHeight : badgeHeight;
      const qualityGap = usePosterLayout ? (input.qualityBadgeGap ?? posterReferenceBadgeGap) : input.badgeGap;
      const qualityHeight = Math.min(posterQualityMaxHeight, Math.round(qualityBaseHeight));
      const columnInset = usePosterLayout ? input.posterRowHorizontalInset : 12;
      const uniformBadgeWidth = Math.min(
        Math.max(72, Math.round(qualityHeight * 1.75)),
        Math.max(72, input.outputWidth - columnInset * 2)
      );
      const findColumnBadgeY = (preferredY: number, x: number, width: number, height: number) => {
        if (!usePosterLayout) return Math.max(input.badgeTopOffset, preferredY);
        const minTop = input.badgeTopOffset;
        const maxTop = Math.max(minTop, input.outputHeight - input.badgeBottomOffset - height);
        const gap = Math.max(4, Math.round(qualityGap * 0.75));
        const pad = Math.max(2, Math.round(gap * 0.4));
        const clampTop = (top: number) => Math.max(minTop, Math.min(Math.round(top), maxTop));
        const fitsAt = (top: number) => {
          const rect: OverlayRect = {
            left: x - pad,
            top: top - pad,
            width: width + pad * 2,
            height: height + pad * 2,
          };
          return !posterBlockingRects.some((blockedRect) => rectsOverlap(rect, blockedRect));
        };
        const firstTop = clampTop(preferredY);
        if (fitsAt(firstTop)) return firstTop;

        for (let candidateTop = firstTop + gap; candidateTop <= maxTop; candidateTop += gap) {
          if (fitsAt(candidateTop)) return candidateTop;
        }
        for (let candidateTop = firstTop - gap; candidateTop >= minTop; candidateTop -= gap) {
          if (fitsAt(candidateTop)) return candidateTop;
        }

        const boundaryCandidates = [
          minTop,
          maxTop,
          ...posterBlockingRects.flatMap((rect) => [
            rect.top - height - gap,
            rect.top + rect.height + gap,
          ]),
        ]
          .map(clampTop)
          .sort((a, b) => Math.abs(a - firstTop) - Math.abs(b - firstTop));
        return boundaryCandidates.find(fitsAt) ?? null;
      };
      let rowY = Math.max(input.badgeTopOffset, startY);
      for (let index = 0; index < columnBadges.length; index += 1) {
        const badge = columnBadges[index];
        if (!STREAM_BADGE_META.has(badge.key as StreamBadgeKey)) continue;
        const spec = buildQualityBadgeSvg(
          badge.key as StreamBadgeKey,
          qualityHeight,
          uniformBadgeWidth,
          input.qualityBadgesStyle,
          iconByProvider.get(badge.key),
          input.qualityBadgesColorMode
        );
        if (!spec) continue;
        const badgeWidth = Math.min(spec.width, uniformBadgeWidth);
        const badgeHeightForRow = spec.height;
        const rowInset = usePosterLayout ? input.posterRowHorizontalInset : 12;
        const rowX =
          side === 'right'
            ? Math.max(rowInset, input.outputWidth - badgeWidth - rowInset)
            : rowInset;
        const freeRowY = findColumnBadgeY(rowY, rowX, badgeWidth, badgeHeightForRow);
        if (freeRowY === null) {
          warnCollision(`Poster quality badge "${badge.key}" could not avoid collision on ${side}`);
          rowY += badgeHeightForRow + qualityGap;
          continue;
        }
        const pad = (spec as any).isPadded ? 12 : 0;
        overlays.push({ input: Buffer.from(spec.svg), top: freeRowY - pad, left: rowX - pad });
        addPosterBlockingRect(rowX, freeRowY, badgeWidth, badgeHeightForRow);
        rowY = freeRowY + badgeHeightForRow + qualityGap;
      }
    };
    type QualityBadgeRowLayout = {
      badgeWidths: number[];
      height: number;
      rowGap: number;
      rowWidth: number;
      rowX: number;
    };
    const getQualityBadgeRowLayout = (
      rowBadges: RatingBadge[],
      baseHeight?: number
    ): QualityBadgeRowLayout | null => {
      if (rowBadges.length === 0) return null;
      const rowInset = usePosterLayout ? input.posterRowHorizontalInset : 12;
      const maxRowWidth = Math.max(0, input.outputWidth - rowInset * 2);
      const qualityBaseHeight =
        usePosterLayout ? posterReferenceBadgeHeight : badgeHeight;
      const qualityBaseGap = usePosterLayout ? (input.qualityBadgeGap ?? posterReferenceBadgeGap) : input.badgeGap;
      let qualityHeight = Math.min(posterQualityMaxHeight, Math.round(baseHeight ?? qualityBaseHeight));
      let rowGap = qualityBaseGap;

      const getBadgeWidth = (key: StreamBadgeKey, h: number): number => {
        const iconMeta = STREAM_BADGE_META.get(key);
        if (iconMeta) {
          return Math.round(h * (iconMeta.iconWidthRatio ?? Math.max(1.35, 0.72 + iconMeta.label.length * 0.34)));
        }
        return Math.round(h * 1.75);
      };

      const getBadgeWidths = (h: number) =>
        rowBadges.map((badge) => {
          if (!STREAM_BADGE_META.has(badge.key as StreamBadgeKey)) return 0;
          return getBadgeWidth(badge.key as StreamBadgeKey, h);
        });

      let badgeWidths = getBadgeWidths(qualityHeight);
      let rowWidth = badgeWidths.reduce((sum, w) => sum + w, 0) + Math.max(0, rowBadges.length - 1) * rowGap;

      let attempts = 0;
      while (rowWidth > maxRowWidth && rowBadges.length > 1 && qualityHeight > posterQualityMinHeight && attempts < 12) {
        const ratio = Math.max(0.72, Math.min(0.94, maxRowWidth / Math.max(1, rowWidth)));
        qualityHeight = Math.max(posterQualityMinHeight, Math.floor(qualityHeight * ratio));
        badgeWidths = getBadgeWidths(qualityHeight);
        rowWidth = badgeWidths.reduce((sum, w) => sum + w, 0) + Math.max(0, rowBadges.length - 1) * rowGap;
        attempts += 1;
      }

      if (rowWidth > maxRowWidth && rowBadges.length > 1) {
        const sumWidths = badgeWidths.reduce((sum, w) => sum + w, 0);
        const availableForGaps = Math.max(0, maxRowWidth - sumWidths);
        rowGap = Math.max(0, Math.floor(availableForGaps / (rowBadges.length - 1)));
        rowWidth = sumWidths + Math.max(0, rowBadges.length - 1) * rowGap;
      }

      let rowX = Math.floor((input.outputWidth - rowWidth) / 2);
      rowX = Math.max(rowInset, Math.min(rowX, Math.max(rowInset, input.outputWidth - rowWidth - rowInset)));
      return { badgeWidths, height: qualityHeight, rowGap, rowWidth, rowX };
    };
    const composeQualityBadgeRow = (
      rowBadges: RatingBadge[],
      rowY: number,
      baseHeight?: number,
      placement = '',
      align: 'center' | 'left' | 'right' = 'center'
    ): number => {
      const layout = getQualityBadgeRowLayout(rowBadges, baseHeight);
      if (!layout) return 0;
      const { badgeWidths, height: qualityHeight, rowGap } = layout;
      const rowInset = usePosterLayout ? input.posterRowHorizontalInset : 12;
      let rowX = align === 'left' ? rowInset : align === 'right' ? Math.max(rowInset, input.outputWidth - layout.rowWidth - rowInset) : layout.rowX;
      const rowStartX = rowX;
      for (let index = 0; index < rowBadges.length; index += 1) {
        const badge = rowBadges[index];
        if (!STREAM_BADGE_META.has(badge.key as StreamBadgeKey)) continue;
        const badgeWidth = badgeWidths[index] ?? 0;
        const spec = buildQualityBadgeSvg(
          badge.key as StreamBadgeKey,
          qualityHeight,
          badgeWidth,
          input.qualityBadgesStyle,
          iconByProvider.get(badge.key),
          input.qualityBadgesColorMode
        );
        if (!spec) continue;
        const pad = (spec as any).isPadded ? 12 : 0;
        overlays.push({ input: Buffer.from(spec.svg), top: rowY - pad, left: rowX - pad });
        addPosterBlockingRect(rowX, rowY, badgeWidth, spec.height);
        rowX += badgeWidth + rowGap;
      }
      if (placement) {
        lastPosterQualityRowLeft = rowStartX;
        lastPosterQualityRowRight = rowX - rowGap;
        lastPosterQualityPlacement = placement;
      }
      return qualityHeight;
    };
    const findPosterQualityRowY = (
      preferredY: number,
      layout: QualityBadgeRowLayout,
      minY: number,
      maxY: number,
      direction: 'up' | 'down'
    ) => {
      const minTop = Math.max(input.badgeTopOffset, Math.round(minY));
      const maxTop = Math.max(
        minTop,
        Math.min(
          Math.round(maxY),
          input.outputHeight - input.badgeBottomOffset - layout.height
        )
      );
      const gap = Math.max(4, Math.round((input.qualityBadgeGap ?? posterReferenceBadgeGap) * 0.75));
      const fitsAt = (top: number) => {
        const rect: OverlayRect = {
          left: layout.rowX,
          top,
          width: layout.rowWidth,
          height: layout.height,
        };
        return !posterBlockingRects.some((blockedRect) => rectsOverlap(rect, blockedRect));
      };
      const clampTop = (top: number) => Math.max(minTop, Math.min(Math.round(top), maxTop));
      const firstTop = clampTop(preferredY);
      if (fitsAt(firstTop)) return firstTop;

      const primaryDelta = direction === 'up' ? -gap : gap;
      for (let top = firstTop + primaryDelta; top >= minTop && top <= maxTop; top += primaryDelta) {
        if (fitsAt(top)) return top;
      }

      const secondaryDelta = -primaryDelta;
      for (let top = firstTop + secondaryDelta; top >= minTop && top <= maxTop; top += secondaryDelta) {
        if (fitsAt(top)) return top;
      }

      const boundaryCandidates = [
        minTop,
        maxTop,
        ...posterBlockingRects.flatMap((rect) => [
          rect.top - layout.height - gap,
          rect.top + rect.height + gap,
        ]),
      ]
        .map(clampTop)
        .sort((a, b) => Math.abs(a - firstTop) - Math.abs(b - firstTop));
      return boundaryCandidates.find(fitsAt) ?? null;
    };
    const getPosterBottomQualityRowY = () => {
      if (!usePosterLayout || input.qualityBadges.length === 0) return null;
      const qualityPlacement = resolvePosterQualityBadgePlacement(
        input.posterRatingsLayout,
        input.qualityBadgesSide,
        input.posterQualityBadgesPosition
      );
      if (qualityPlacement !== 'bottom') return null;

      const qualityHeight = Math.min(posterQualityMaxHeight, Math.round(posterReferenceBadgeHeight));
      const bottomRatingHeight =
        input.bottomBadges.length > 0 ? Math.max(badgeHeight, posterReferenceBadgeHeight) : 0;
      const bottomGap =
        input.bottomBadges.length > 0
          ? Math.max(input.badgeGap, input.qualityBadgeGap ?? posterReferenceBadgeGap)
          : 0;
      return Math.max(
        input.badgeTopOffset,
        input.outputHeight - input.badgeBottomOffset - bottomRatingHeight - bottomGap - qualityHeight
      );
    };
    const renderQualityBadgeColumnAt = (
      columnBadges: RatingBadge[],
      startY: number,
      x: number,
      qualityHeight: number,
      uniformBadgeWidth: number
    ) => {
      if (columnBadges.length === 0) return;
      const columnInset = usePosterLayout ? input.posterRowHorizontalInset : 12;
      let rowY = Math.max(input.badgeTopOffset, startY);
      const clampedX = Math.max(
        columnInset,
        Math.min(Math.round(x), Math.max(columnInset, input.outputWidth - uniformBadgeWidth - columnInset))
      );
      for (let index = 0; index < columnBadges.length; index += 1) {
        const badge = columnBadges[index];
        if (!STREAM_BADGE_META.has(badge.key as StreamBadgeKey)) continue;
        const spec = buildQualityBadgeSvg(
          badge.key as StreamBadgeKey,
          qualityHeight,
          uniformBadgeWidth,
          input.qualityBadgesStyle,
          iconByProvider.get(badge.key),
          input.qualityBadgesColorMode
        );
        if (!spec) continue;
        const pad = (spec as any).isPadded ? 12 : 0;
        overlays.push({ input: Buffer.from(spec.svg), top: rowY - pad, left: clampedX - pad });
        addPosterBlockingRect(clampedX, rowY, uniformBadgeWidth, spec.height);
        rowY += spec.height + input.badgeGap;
      }
    };

    if (input.imageType === 'logo') {
      let rowY = imageTop + renderedImageHeight + input.logoBadgeTopGap;
      if (input.qualityBadges.length > 0) {
        composeQualityBadgeRow(input.qualityBadges, rowY, badgeHeight);
        rowY += Math.max(36, Math.round(badgeHeight * 1.05)) + input.badgeGap;
      }

      if (input.badges.length > 0 && input.logoBadgeBandHeight > 0 && input.logoBadgesPerRow > 0) {
        const rows = chunkBy(input.badges, input.logoBadgesPerRow);

        for (const row of rows) {
          composeBadgeRow(row, rowY, {
            maxRowWidth: input.logoBadgeMaxWidth,
          });
          rowY += badgeHeight + input.badgeGap;
        }
      }
    } else if (
      input.badges.length > 0 ||
      (usePosterLayout && (posterTitleSpec || posterLogoSpec))
    ) {
      if (!usePosterLayout && (input.imageType === 'backdrop' || input.imageType === 'thumbnail')) {
        const backdropPlacement = getBackdropBadgePlacement(
          input.outputWidth,
          input.backdropRatingsLayout,
          input.imageType
        );
        if (backdropPlacement.stack === 'column') {
          const maxBadgeWidth = Math.max(180, Math.floor(backdropPlacement.width - 24));
          const backdropColumns =
            input.backdropColumns && input.backdropColumns.length > 0
              ? input.backdropColumns.filter((column) => column.length > 0)
              : [];
          const hasMultipleColumns = backdropColumns.length > 1;
          if (
            hasMultipleColumns &&
            !composeBackdropBadgeColumns(backdropColumns, backdropPlacement)
          ) {
            const fallbackColumnBadges =
              backdropColumns[0]?.length
                ? backdropColumns[0]
                : input.rightBadges.length > 0
                  ? input.rightBadges
                  : input.leftBadges.length > 0
                    ? input.leftBadges
                    : input.badges;
            composeBackdropBadgeColumn(fallbackColumnBadges, backdropPlacement, maxBadgeWidth);
          } else if (!hasMultipleColumns) {
            const columnBadges =
              backdropColumns[0]?.length
                ? backdropColumns[0]
                : input.rightBadges.length > 0
                  ? input.rightBadges
                  : input.leftBadges.length > 0
                    ? input.leftBadges
                    : input.badges;
            composeBackdropBadgeColumn(columnBadges, backdropPlacement, maxBadgeWidth);
          }
        } else {
          const backdropRows =
            input.backdropRows && input.backdropRows.length > 0
              ? input.backdropRows
              : [input.topBadges, input.bottomBadges].filter((row) => row.length > 0);
          const totalRowsHeight =
            backdropRows.length * badgeHeight + Math.max(0, backdropRows.length - 1) * input.badgeGap;
          let rowY =
            backdropPlacement.vertical === 'top'
              ? input.badgeTopOffset
              : backdropPlacement.vertical === 'bottom'
                ? Math.max(input.badgeTopOffset, input.outputHeight - input.badgeBottomOffset - totalRowsHeight)
                : Math.max(input.badgeTopOffset, Math.round((input.outputHeight - totalRowsHeight) / 2));
          for (const row of backdropRows) {
            composeBadgeRow(row, rowY, {
              regionLeft: backdropPlacement.left,
              regionWidth: backdropPlacement.width,
              align: backdropPlacement.align,
            });
            rowY += badgeHeight + input.badgeGap;
          }
        }
        composeThumbnailFallbackOverlay();
      } else if (usePosterLayout) {
        const bottomRatingHeight = Math.max(badgeHeight, posterReferenceBadgeHeight);
        const bottomRowY = Math.max(
          input.badgeTopOffset,
          input.outputHeight - input.badgeBottomOffset - bottomRatingHeight
        );
        if (input.posterRatingsLayout === 'left' || input.posterRatingsLayout === 'right') {
          const maxBadgeWidth = Math.max(180, Math.floor(input.outputWidth * 0.46));
          composeBadgeColumn(
            input.posterRatingsLayout === 'left' ? input.leftBadges : input.rightBadges,
            input.posterRatingsLayout,
            maxBadgeWidth
          );
        } else if (input.posterRatingsLayout === 'left-right') {
          const maxBadgeWidth = Math.max(180, Math.floor(input.outputWidth * 0.46));
          const remainingLeftBadges = input.leftBadges;
          const remainingRightBadges = input.rightBadges;

          if (input.topBadges.length > 0) {
            for (const badge of input.topBadges) {
              composePosterCenteredTopBadge(badge, 'top');
            }
          }

          const sideStartY =
            input.topBadges.length > 0
              ? input.badgeTopOffset + Math.max(badgeHeight, posterReferenceBadgeHeight) + input.badgeGap
              : input.badgeTopOffset;
          if (remainingLeftBadges.length === remainingRightBadges.length) {
            for (let index = 0; index < remainingLeftBadges.length; index += 1) {
              const rowY = sideStartY + index * (verticalBadgeHeight + input.badgeGap);
              composeEdgeAlignedPosterBadge(remainingLeftBadges[index], rowY, 'left', maxBadgeWidth);
              composeEdgeAlignedPosterBadge(remainingRightBadges[index], rowY, 'right', maxBadgeWidth);
            }
          } else {
            composeBadgeColumn(remainingLeftBadges, 'left', maxBadgeWidth, 'top', sideStartY);
            composeBadgeColumn(remainingRightBadges, 'right', maxBadgeWidth, 'top', sideStartY);
          }
        } else {
          if (input.topBadges.length > 0) {
            composeBadgeRow(input.topBadges, input.badgeTopOffset, {
              regionLeft: input.posterRowHorizontalInset,
              regionWidth: posterRowRegionWidth,
              align: posterTopRowAlign,
            });
          }
          if (input.bottomBadges.length > 0) {
            composeBadgeRow(input.bottomBadges, bottomRowY, {
              regionLeft: input.posterRowHorizontalInset,
              regionWidth: posterRowRegionWidth,
              align: posterBottomRowAlign,
            });
          }
        }
        composePosterCleanOverlayAboveBottom();
      }
    }

    if (usePosterLayout && input.qualityBadges.length > 0) {
      let qualityPlacement = resolvePosterQualityBadgePlacement(
        input.posterRatingsLayout,
        input.qualityBadgesSide,
        input.posterQualityBadgesPosition
      );

      if (qualityPlacement === 'bottom') {
        const hasBottomRatings = input.bottomBadges.length > 0;
        const hasTopRatings = input.topBadges.length > 0;
        const isAuto = input.posterQualityBadgesPosition === 'auto';
        if (hasBottomRatings && !hasTopRatings && isAuto) {
          qualityPlacement = 'top';
        }
      }

      const metrics: BadgeLayoutMetrics = {
        iconSize: input.badgeIconSize,
        fontSize: input.badgeFontSize,
        paddingX: input.badgePaddingX,
        paddingY: input.badgePaddingY,
        gap: input.badgeGap,
      };
      const qualityBadgeHeight = Math.max(32, posterReferenceBadgeHeight);
      const rankingPosRaw = input.rankingPosition || 'auto';
      const resolvedRankingPos: string = rankingPosRaw === 'auto'
        ? (lastOverlayTopY > 0 ? 'above-logo' : 'top')
        : rankingPosRaw;
      const rankingSharesQualityRow = input.rankingBadge != null && resolvedRankingPos === qualityPlacement;
      const genreSharesQualityRow = input.posterGenreBadge != null && input.posterGenrePosition === qualityPlacement && !rankingSharesQualityRow;
      const qualityAlign = (rankingSharesQualityRow || genreSharesQualityRow) ? 'right' : 'center';
      if (qualityPlacement === 'top') {
        const qualityLayout = getQualityBadgeRowLayout(input.qualityBadges, posterReferenceBadgeHeight);
        if (qualityLayout) {
          const rowY = findPosterQualityRowY(
            input.badgeTopOffset,
            qualityLayout,
            input.badgeTopOffset,
            Math.round(input.outputHeight * 0.4),
            'down'
          );
          if (rowY === null) {
            warnCollision('Poster quality badges could not avoid collision at top');
          } else {
            const actualQualityHeight = composeQualityBadgeRow(input.qualityBadges, rowY, posterReferenceBadgeHeight, 'top', qualityAlign);
            lastPosterQualityTopY = rowY;
            lastPosterQualityBottomY = rowY + actualQualityHeight;
          }
        }
      } else if (qualityPlacement === 'bottom') {
        const preferredBottomRowY = getPosterBottomQualityRowY() ?? Math.max(
          input.badgeTopOffset,
          input.outputHeight - input.badgeBottomOffset - Math.min(posterQualityMaxHeight, Math.round(posterReferenceBadgeHeight))
        );
        const qualityLayout = getQualityBadgeRowLayout(input.qualityBadges, posterReferenceBadgeHeight);
        const bottomRowY =
          qualityLayout
            ? findPosterQualityRowY(
              preferredBottomRowY,
              qualityLayout,
              input.badgeTopOffset,
              preferredBottomRowY,
              'up'
            )
            : null;
        if (bottomRowY === null) {
          warnCollision('Poster quality badges could not avoid collision at bottom');
        } else {
          const actualQualityHeight = composeQualityBadgeRow(input.qualityBadges, bottomRowY, posterReferenceBadgeHeight, 'bottom', qualityAlign);
          lastPosterQualityTopY = bottomRowY;
          lastPosterQualityBottomY = bottomRowY + actualQualityHeight;
        }
      } else if (qualityPlacement === 'above-logo') {
        const qualityLayout = getQualityBadgeRowLayout(input.qualityBadges, posterReferenceBadgeHeight);
        if (qualityLayout) {
          const overlayGap = Math.max(18, Math.round(posterReferenceBadgeGap * 1.8));
          const preferredRowY =
            lastOverlayTopY > 0
              ? lastOverlayTopY - qualityLayout.height - overlayGap
              : Math.round((input.outputHeight - qualityLayout.height) / 2);
          const maxRowY =
            lastOverlayTopY > 0
              ? lastOverlayTopY - qualityLayout.height - overlayGap
              : input.outputHeight - input.badgeBottomOffset - qualityLayout.height;
          const rowY = findPosterQualityRowY(
            preferredRowY,
            qualityLayout,
            input.badgeTopOffset,
            maxRowY,
            'up'
          );
          if (rowY === null) {
            warnCollision('Poster quality badges could not avoid collision above logo');
          } else {
            const actualQualityHeight = composeQualityBadgeRow(input.qualityBadges, rowY, posterReferenceBadgeHeight, 'above-logo', qualityAlign);
            lastPosterQualityTopY = rowY;
            lastPosterQualityBottomY = rowY + actualQualityHeight;
          }
        }
      } else {
        const columnBadges = [...input.qualityBadges];
        const qualityTotalHeight =
          columnBadges.length * qualityBadgeHeight +
          Math.max(0, columnBadges.length - 1) * input.badgeGap;
        const centeredStartY = Math.max(
          input.badgeTopOffset,
          Math.round((input.outputHeight - qualityTotalHeight) / 2)
        );
        let qualityStartY = centeredStartY;
        const shouldTopAlignQuality =
          (input.posterRatingsLayout === 'left' || input.posterRatingsLayout === 'right') &&
          (qualityPlacement === 'left' || qualityPlacement === 'right');
        if (shouldTopAlignQuality) {
          qualityStartY = input.badgeTopOffset;
        } else if (input.topBadges.length > 0) {
          const belowTop =
            input.badgeTopOffset +
            Math.max(verticalBadgeHeight, posterReferenceVerticalBadgeHeight) +
            Math.max(input.badgeGap, posterReferenceBadgeGap);
          qualityStartY = Math.max(qualityStartY, belowTop);
        } else {
          const sideBadges = qualityPlacement === 'right' ? input.rightBadges : input.leftBadges;
          if (sideBadges.length > 0) {
            const sideColumnHeight = measureBadgeColumnHeight(sideBadges, metrics, input.verticalBadgeContent);
            if (sideColumnHeight > 0) {
              const belowSide = input.badgeTopOffset + sideColumnHeight + input.badgeGap;
              qualityStartY = Math.max(qualityStartY, belowSide);
            }
          }
        }
        composeQualityBadgeColumn(columnBadges, qualityStartY, qualityPlacement === 'right' ? 'right' : 'left');
      }
    }

    if (!usePosterLayout && input.imageType === 'backdrop' && input.qualityBadges.length > 0) {
      const qualityHeight = Math.max(44, Math.round(badgeHeight * 1.25));
      const uniformBadgeWidth = Math.min(
        Math.max(72, Math.round(qualityHeight * 1.75)),
        Math.max(72, input.outputWidth - 24)
      );
      const usableQualityBadges = input.qualityBadges.filter((badge) =>
        STREAM_BADGE_META.has(badge.key as StreamBadgeKey)
      );
      if (usableQualityBadges.length > 0) {
        const leftColumn: RatingBadge[] = [];
        const rightColumn: RatingBadge[] = [];
        if (input.backdropRatingsLayout === 'center' && usableQualityBadges.length === 2) {
          leftColumn.push(usableQualityBadges[0]);
          rightColumn.push(usableQualityBadges[1]);
        } else {
          for (const badge of usableQualityBadges) {
            if (leftColumn.length < 2) {
              leftColumn.push(badge);
            } else if (rightColumn.length < 2) {
              rightColumn.push(badge);
            } else if (leftColumn.length <= rightColumn.length) {
              leftColumn.push(badge);
            } else {
              rightColumn.push(badge);
            }
          }
        }
        const startY = input.badgeTopOffset;
        const columnGap = Math.max(8, Math.round(input.badgeGap * 0.8));
      const metrics: BadgeLayoutMetrics = {
        iconSize: input.badgeIconSize,
        fontSize: input.badgeFontSize,
        paddingX: input.badgePaddingX,
        paddingY: input.badgePaddingY,
        gap: input.badgeGap,
      };
        const backdropPlacement = getBackdropBadgePlacement(
          input.outputWidth,
          input.backdropRatingsLayout,
          input.imageType
        );
        const effectiveMaxWidth = Math.max(0, backdropPlacement.width - 24);
        const backdropRows =
          input.backdropRows && input.backdropRows.length > 0
            ? input.backdropRows
            : [input.topBadges, input.bottomBadges].filter((row) => row.length > 0);
        const verticalBackdropColumns =
          backdropPlacement.stack === 'column'
            ? (input.backdropColumns && input.backdropColumns.length > 0
              ? input.backdropColumns
              : [input.leftBadges, input.rightBadges].filter((column) => column.length > 0))
            : [];
        const ratingCenterX = backdropPlacement.left + backdropPlacement.width / 2;
        let ratingLeft = ratingCenterX;
        let ratingRight = ratingCenterX;
        let ratingBlockTop = startY;
        let ratingBlockBottom = startY;
        let ratingRows = 0;
        if (backdropPlacement.stack === 'column' && verticalBackdropColumns.length > 0) {
          const estimatedColumns = verticalBackdropColumns.map((columnBadges) => {
            const maxWidth = columnBadges.reduce(
              (columnMaxWidth, badge) =>
                Math.max(
                  columnMaxWidth,
                  estimateBadgeWidth(
                    badge.value,
                    input.badgeFontSize,
                    input.badgePaddingX,
                    input.badgeIconSize,
                    input.badgeGap,
                    false,
                    input.verticalBadgeContent
                  )
                ),
              0
            );
            return {
              maxWidth,
              height: measureBadgeColumnHeight(columnBadges, metrics, input.verticalBadgeContent),
            };
          });
          const ratingBlockWidth =
            estimatedColumns.reduce((sum, column) => sum + column.maxWidth, 0) +
            Math.max(0, estimatedColumns.length - 1) * Math.max(12, input.badgeGap);
          const columnStartX =
            backdropPlacement.align === 'right'
              ? backdropPlacement.left + backdropPlacement.width - ratingBlockWidth
              : backdropPlacement.align === 'center'
                ? backdropPlacement.left + Math.floor((backdropPlacement.width - ratingBlockWidth) / 2)
                : backdropPlacement.left;
          const tallestHeight = estimatedColumns.reduce(
            (maxHeight, column) => Math.max(maxHeight, column.height),
            0
          );
          ratingLeft = columnStartX;
          ratingRight = columnStartX + ratingBlockWidth;
          ratingBlockTop =
            backdropPlacement.vertical === 'bottom'
              ? Math.max(input.badgeTopOffset, input.outputHeight - input.badgeBottomOffset - tallestHeight)
              : backdropPlacement.vertical === 'center'
                ? Math.max(input.badgeTopOffset, Math.round((input.outputHeight - tallestHeight) / 2))
                : startY;
          ratingBlockBottom = ratingBlockTop + tallestHeight;
        } else {
          const ratingBlockWidth = backdropRows.reduce((maxWidth, row) => {
            const rowWidth = Math.min(measureBadgeRowWidth(row, metrics), effectiveMaxWidth);
            return Math.max(maxWidth, rowWidth);
          }, 0);
          const totalRowsHeight =
            backdropRows.length * badgeHeight + Math.max(0, backdropRows.length - 1) * input.badgeGap;
          if (backdropPlacement.align === 'right') {
            ratingRight = backdropPlacement.left + backdropPlacement.width;
            ratingLeft = ratingRight - ratingBlockWidth;
          } else if (backdropPlacement.align === 'left') {
            ratingLeft = backdropPlacement.left;
            ratingRight = ratingLeft + ratingBlockWidth;
          } else {
            ratingLeft = ratingCenterX - ratingBlockWidth / 2;
            ratingRight = ratingCenterX + ratingBlockWidth / 2;
          }
          ratingRows =
            input.backdropRows && input.backdropRows.length > 0
              ? input.backdropRows.length
              : (input.topBadges.length > 0 ? 1 : 0) + (input.bottomBadges.length > 0 ? 1 : 0);
          ratingBlockTop =
            backdropPlacement.vertical === 'bottom'
              ? Math.max(input.badgeTopOffset, input.outputHeight - input.badgeBottomOffset - totalRowsHeight)
              : backdropPlacement.vertical === 'center'
                ? Math.max(input.badgeTopOffset, Math.round((input.outputHeight - totalRowsHeight) / 2))
                : startY;
          ratingBlockBottom =
            ratingRows > 0
              ? ratingBlockTop + totalRowsHeight
              : startY;
        }
        const stackedQualityStartY =
          input.backdropRatingsLayout === 'center' || input.backdropRatingsLayout === 'right-vertical'
            ? startY
            : ratingBlockBottom + Math.max(input.badgeGap, Math.round(columnGap * 1.2));
        const placeQualityLeftOfRatings = backdropPlacement.align === 'right';
        let qualityStartY = placeQualityLeftOfRatings ? ratingBlockTop : stackedQualityStartY;

        if (rightColumn.length === 0) {
          let singleX = Math.max(
            12,
            Math.round(
              input.backdropRatingsLayout === 'center'
                ? ratingCenterX - uniformBadgeWidth / 2
                : placeQualityLeftOfRatings
                  ? ratingLeft - columnGap - uniformBadgeWidth
                  : input.backdropRatingsLayout.startsWith('right')
                    ? ratingRight + columnGap
                    : ratingLeft - columnGap - uniformBadgeWidth
            )
          );
          if (backdropPlacement.stack === 'column') {
            qualityStartY = ratingBlockTop;
            singleX = Math.max(12, Math.round(ratingLeft - columnGap - uniformBadgeWidth));
          }
          const singleStartY =
            backdropPlacement.stack !== 'column' &&
              input.backdropRatingsLayout === 'center' &&
              ratingRows > 0
              ? startY + ratingRows * (badgeHeight + input.badgeGap)
              : qualityStartY;
          renderQualityBadgeColumnAt(
            leftColumn,
            singleStartY,
            singleX,
            qualityHeight,
            uniformBadgeWidth
          );
        } else {
          let leftX = 12;
          let rightX = Math.max(12, input.outputWidth - uniformBadgeWidth - 12);
          if (backdropPlacement.stack === 'column') {
            qualityStartY = ratingBlockTop;
            rightX = Math.max(12, Math.round(ratingLeft - columnGap - uniformBadgeWidth));
            leftX = Math.max(12, rightX - columnGap - uniformBadgeWidth);
          } else if (placeQualityLeftOfRatings) {
            rightX = ratingLeft - columnGap - uniformBadgeWidth;
            leftX = rightX - columnGap - uniformBadgeWidth;
          } else {
            leftX = ratingLeft - columnGap - uniformBadgeWidth;
            rightX = ratingRight + columnGap;
          }

          renderQualityBadgeColumnAt(
            leftColumn,
            qualityStartY,
            leftX,
            qualityHeight,
            uniformBadgeWidth
          );
          renderQualityBadgeColumnAt(
            rightColumn,
            qualityStartY,
            rightX,
            qualityHeight,
            uniformBadgeWidth
          );
        }
      }
    }

    function composePosterGenreBadge() {
      if (
        posterGenreBadgeComposed ||
        !usePosterLayout ||
        !input.posterGenreBadge ||
        input.posterGenrePosition === 'off'
      ) {
        return;
      }
      posterGenreBadgeComposed = true;
      const badge = input.posterGenreBadge;
      const position = input.posterGenrePosition;
      const metrics: BadgeLayoutMetrics = {
        iconSize: input.badgeIconSize,
        fontSize: input.badgeFontSize,
        paddingX: input.badgePaddingX,
        paddingY: input.badgePaddingY,
        gap: input.badgeGap,
      };

      const genreHeight = estimateBadgeHeight(metrics.fontSize, metrics.paddingX, metrics.paddingY, 0, 'standard');
      const genreWidth = estimateBadgeWidth(badge.value, metrics.fontSize, metrics.paddingX, 0, metrics.gap, false, 'standard');

      const tryGenreSameRowAsQuality = (): { left: number; top: number } | null => {
        if (lastPosterQualityTopY <= 0 || !lastPosterQualityPlacement) return null;
        if (rankingPlacedSameRowAsQuality) return null;
        if (position !== lastPosterQualityPlacement) return null;
        const rowInset = usePosterLayout ? input.posterRowHorizontalInset : 12;
        if (genreWidth > lastPosterQualityRowLeft - rowInset) return null;
        const genreLeft = rowInset;
        const rowY = Math.max(0, lastPosterQualityTopY + Math.round((lastPosterQualityBottomY - lastPosterQualityTopY - genreHeight) / 2));
        const genreRect: OverlayRect = { left: genreLeft, top: rowY, width: genreWidth, height: genreHeight };
        if (posterBlockingRects.some((rect) => rectsOverlap(genreRect, rect))) return null;
        return { left: genreLeft, top: rowY };
      };

      const tryGenreSameRowAsRanking = (): { left: number; top: number } | null => {
        if (lastRankingRowTopY <= 0 || !lastRankingPlacement) return null;
        if (rankingSharesGenreRow) return null;
        if (position !== lastRankingPlacement) return null;
        const rowInset = usePosterLayout ? input.posterRowHorizontalInset : 12;
        const genreRight = input.outputWidth - rowInset;
        const genreLeft = genreRight - genreWidth;
        if (genreLeft < lastRankingRowRight + Math.max(3, Math.round(input.badgeGap * 0.35))) return null;
        const rowY = Math.max(0, lastRankingRowTopY + Math.round((lastRankingRowBottomY - lastRankingRowTopY - genreHeight) / 2));
        const genreRect: OverlayRect = { left: genreLeft, top: rowY, width: genreWidth, height: genreHeight };
        if (posterBlockingRects.some((rect) => rectsOverlap(genreRect, rect))) return null;
        return { left: genreLeft, top: rowY };
      };

      const genreSameRowResult = tryGenreSameRowAsQuality() ?? tryGenreSameRowAsRanking();
      if (genreSameRowResult) {
        const badgeSvg = buildBadgeSvg({
          width: genreWidth,
          height: genreHeight,
          iconSize: 0,
          fontSize: metrics.fontSize,
          paddingX: metrics.paddingX,
          gap: metrics.gap,
          accentColor: badge.accentColor || '#4b5563',
          monogram: '',
          value: badge.value,
          ratingStyle: 'plain',
          compactText: false,
        });
        const renderedSvg = badgeSvg
          .replace(`width="${genreWidth}"`, `width="${genreWidth + 8}"`)
          .replace(`height="${genreHeight}"`, `height="${genreHeight + 8}"`);
        overlays.push({ input: Buffer.from(renderedSvg), top: genreSameRowResult.top - 4, left: genreSameRowResult.left - 4 });
        const genrePad = Math.max(4, Math.round(Math.max(12, Math.round(input.badgeGap * 1.1)) * 0.4));
        addPosterBlockingRect(
          genreSameRowResult.left - genrePad,
          genreSameRowResult.top - genrePad,
          genreWidth + genrePad * 2,
          genreHeight + genrePad * 2
        );
        return;
      }

      const rowInset = usePosterLayout ? input.posterRowHorizontalInset : 12;
      const sharesPositionWithQuality = !!lastPosterQualityPlacement && position === lastPosterQualityPlacement;
      const sharesPositionWithRanking = !!lastRankingPlacement && position === lastRankingPlacement && !rankingPlacedSameRowAsQuality;
      let left = (sharesPositionWithQuality || sharesPositionWithRanking)
        ? rowInset
        : Math.round((input.outputWidth - genreWidth) / 2);

      const overlapGap = Math.max(12, Math.round(input.badgeGap * 1.1));
      const getGenreRect = (y: number) => ({ left, top: y, width: genreWidth, height: genreHeight });

      let top = input.badgeTopOffset;
      if (position === 'bottom') {
        top = input.outputHeight - input.badgeBottomOffset - genreHeight;
      } else if (position === 'above-logo') {
        if (lastOverlayTopY > 0) {
          top = lastOverlayTopY - genreHeight - overlapGap;
        } else {
          top = input.outputHeight - input.badgeBottomOffset - genreHeight;
        }
      }

      if (position === 'bottom') {
        const bottomClamp = Math.max(input.badgeTopOffset, input.outputHeight - input.badgeBottomOffset - genreHeight);
        top = bottomClamp;
        for (let y = bottomClamp; y >= input.badgeTopOffset; y -= overlapGap) {
          const rect = getGenreRect(y);
          const collisions = posterBlockingRects.filter(r => rectsOverlap(rect, r));
          if (collisions.length === 0) { top = y; break; }
        }
      } else if (position === 'above-logo') {
        if (lastOverlayTopY > 0) {
          const idealTop = Math.max(input.badgeTopOffset, lastOverlayTopY - genreHeight - overlapGap);
          top = idealTop;
          for (let y = idealTop; y >= input.badgeTopOffset; y -= overlapGap) {
            const rect = getGenreRect(y);
            const collisions = posterBlockingRects.filter(r => rectsOverlap(rect, r));
            if (collisions.length === 0) { top = y; break; }
          }
        } else {
          const bottomClamp = Math.max(input.badgeTopOffset, input.outputHeight - input.badgeBottomOffset - genreHeight);
          top = bottomClamp;
          for (let guard = 0; guard < 12; guard++) {
            top = Math.max(input.badgeTopOffset, Math.min(top, bottomClamp));
            const rect = getGenreRect(top);
            const collisions = posterBlockingRects.filter(r => rectsOverlap(rect, r));
            if (collisions.length === 0) break;
            const highestBlockedTop = Math.max(...collisions.map(r => r.top));
            top = Math.max(input.badgeTopOffset, highestBlockedTop - genreHeight - overlapGap);
            if (top < input.outputHeight * 0.4) {
              top = bottomClamp;
              break;
            }
          }
        }
      } else {
        top = input.badgeTopOffset;
        for (let y = input.badgeTopOffset; y <= input.outputHeight - input.badgeBottomOffset - genreHeight; y += overlapGap) {
          const rect = getGenreRect(y);
          const collisions = posterBlockingRects.filter(r => rectsOverlap(rect, r));
          if (collisions.length === 0) { top = y; break; }
        }
      }

      const minGenreTop = input.badgeTopOffset;
      const maxGenreTop = Math.max(
        minGenreTop,
        input.outputHeight - input.badgeBottomOffset - genreHeight
      );
      const genreTopCandidates = [
        top,
        minGenreTop,
        maxGenreTop,
        ...posterBlockingRects.flatMap((blockedRect) => [
          blockedRect.top - genreHeight - overlapGap,
          blockedRect.top + blockedRect.height + overlapGap,
        ]),
      ];
      for (let y = minGenreTop; y <= maxGenreTop; y += overlapGap) {
        genreTopCandidates.push(y);
      }
      const genreLeftCandidates = [
        left,
        rowInset,
        Math.max(rowInset, input.outputWidth - genreWidth - rowInset),
        Math.max(rowInset, Math.round((input.outputWidth - genreWidth) / 2)),
      ].filter((candidateLeft, index, values) => values.indexOf(candidateLeft) === index);
      const freeGenreRect = findFirstNonOverlappingRect(
        genreTopCandidates
          .map((candidateTop) => Math.max(minGenreTop, Math.min(Math.round(candidateTop), maxGenreTop)))
          .filter((candidateTop, index, values) => values.indexOf(candidateTop) === index)
          .flatMap((candidateTop) =>
            genreLeftCandidates.map((candidateLeft) => ({
              left: candidateLeft,
              top: candidateTop,
              width: genreWidth,
              height: genreHeight,
            }))
          ),
        posterBlockingRects,
        0
      );
      if (!freeGenreRect) {
        warnCollision(`Poster genre badge "${badge.value}" could not avoid collision`);
        return;
      }
      left = freeGenreRect.left;
      top = freeGenreRect.top;

      const badgeSvg = buildBadgeSvg({
        width: genreWidth,
        height: genreHeight,
        iconSize: 0,
        fontSize: metrics.fontSize,
        paddingX: metrics.paddingX,
        gap: metrics.gap,
        accentColor: badge.accentColor || '#4b5563',
        monogram: '',
        value: badge.value,
        ratingStyle: 'plain',
        compactText: false,
      });

      // Compensate for the 4px padding in buildBadgeSvg's viewBox
      const renderedSvg = badgeSvg
        .replace(`width="${genreWidth}"`, `width="${genreWidth + 8}"`)
        .replace(`height="${genreHeight}"`, `height="${genreHeight + 8}"`);

      overlays.push({ input: Buffer.from(renderedSvg), top: top - 4, left: left - 4 });
      const genrePad = Math.max(4, Math.round(overlapGap * 0.4));
      addPosterBlockingRect(
        left - genrePad,
        top - genrePad,
        genreWidth + genrePad * 2,
        genreHeight + genrePad * 2
      );
    }

    if (usePosterLayout && input.rankingBadge) {
      const badge = input.rankingBadge;
      const rankingIconDataUri = await getProviderIconDataUri(
        RANKING_ICON_URL,
        0,
        { width: Math.round(96 * posterOutputScale), height: Math.round(96 * posterOutputScale) }
      );
      const rankingScale = (input.posterConfiguratorPreset === 'advanced' ? 1.3 : 1.15) * posterOutputScale;
      const rankingSpec = buildRankingBadgeSvg(
        badge.value,
        badge.compact ? '' : badge.label,
        badge.compact ? null : rankingIconDataUri,
        badge.noBox ?? (input.posterConfiguratorPreset === 'simple'),
        rankingScale
      );
      const maxWidth = Math.max(1, input.outputWidth - 24);
      const scale = rankingSpec.width > maxWidth ? maxWidth / rankingSpec.width : 1;
      let renderedWidth = Math.round(rankingSpec.width * scale);
      let renderedHeight = Math.round(rankingSpec.height * scale);
      const targetRankingHeight = Math.round(Math.min(posterQualityMaxHeight, posterReferenceBadgeHeight) * 1.6);
      if (renderedHeight > targetRankingHeight) {
        const heightScale = targetRankingHeight / renderedHeight;
        renderedWidth = Math.round(renderedWidth * heightScale);
        renderedHeight = targetRankingHeight;
      }
      let rankingBuffer =
        renderedWidth < rankingSpec.width
          ? await sharp(Buffer.from(rankingSpec.svg))
            .resize(renderedWidth, renderedHeight, { fit: 'fill' })
            .png()
            .toBuffer()
          : Buffer.from(rankingSpec.svg);
      const left = Math.max(12, Math.floor((input.outputWidth - renderedWidth) / 2));
      const rankingGap = Math.max(3, Math.round(input.badgeGap * 0.35));
      type SameRowPlacement = { left: number; top: number; scaled?: boolean; kind: 'top' | 'quality' };
      const trySameRowAsTopRatings = (): SameRowPlacement | null => {
        if (
          input.rankingPosition !== 'top' ||
          lastTopBadgeRowRight <= lastTopBadgeRowLeft ||
          lastTopBadgeRowBottom <= lastTopBadgeRowTop
        ) {
          return null;
        }
        const rowInset = input.posterRowHorizontalInset;
        const preferredLeft = Math.max(
          rowInset,
          lastTopBadgeRowLeft - renderedWidth - rankingGap
        );
        const maxLeft = Math.max(rowInset, input.outputWidth - renderedWidth - rowInset);
        const candidates = [preferredLeft, rowInset, maxLeft]
          .map((candidateLeft) => Math.max(rowInset, Math.min(candidateLeft, maxLeft)))
          .filter((candidateLeft, index, values) => values.indexOf(candidateLeft) === index)
          .map((candidateLeft) => ({
            left: candidateLeft,
            top: lastTopBadgeRowTop,
            width: renderedWidth,
            height: renderedHeight,
          }));
        const placement = findFirstNonOverlappingRect(candidates, posterBlockingRects, 0);
        return placement ? { ...placement, kind: 'top' } : null;
      };
      const trySameRowAsQuality = (): SameRowPlacement | null => {
        if (lastPosterQualityTopY <= 0 || !lastPosterQualityPlacement) return null;
        const rankingPosRaw2 = input.rankingPosition || 'auto';
        const resolvedRankingPos2: string = rankingPosRaw2 === 'auto'
          ? (lastOverlayTopY > 0 ? 'above-logo' : 'top')
          : rankingPosRaw2;
        if (resolvedRankingPos2 !== lastPosterQualityPlacement) return null;
        const rowInset = usePosterLayout ? input.posterRowHorizontalInset : 12;
        const rankingLeft = rowInset;
        const qualityHeight = lastPosterQualityBottomY - lastPosterQualityTopY;
        if (renderedHeight > qualityHeight && qualityHeight > 0) {
          return { left: rankingLeft, top: lastPosterQualityTopY, scaled: true, kind: 'quality' };
        }
        const rowY = Math.max(input.badgeTopOffset, lastPosterQualityTopY);
        return { left: rankingLeft, top: rowY, kind: 'quality' };
      };
      const getTopRankingTop = () => {
        const qualityRefHeight = Math.min(posterQualityMaxHeight, posterReferenceBadgeHeight);
        const baseTop = input.badgeTopOffset + Math.round((qualityRefHeight - renderedHeight) / 2);
        let nextTop = baseTop;
        if (input.topBadges.length > 0) {
          nextTop = Math.max(nextTop, input.badgeTopOffset + verticalBadgeHeight + rankingGap);
        }
        if (input.qualityBadges.length > 0) {
          const qualityPlacement = resolvePosterQualityBadgePlacement(
            input.posterRatingsLayout,
            input.qualityBadgesSide,
            input.posterQualityBadgesPosition
          );
          if (qualityPlacement === 'top' && input.posterConfiguratorPreset !== 'simple') {
        const topQualityHeight = posterReferenceBadgeHeight;
            nextTop = Math.max(nextTop, input.badgeTopOffset + topQualityHeight + rankingGap);
          }
        }
        return nextTop;
      };
      const getAboveLogoRankingTop = () => {
        if (lastOverlayTopY <= 0) return getTopRankingTop();
        const overlayGap = Math.max(36, Math.round(posterReferenceBadgeGap * 3.0));
        return Math.max(input.badgeTopOffset, lastOverlayTopY - renderedHeight - overlayGap);
      };
      const getBottomRankingTop = () => {
        const overlapGap = Math.max(8, Math.round(posterReferenceBadgeGap * 0.9));
        let bottomLimit = Math.max(
          input.badgeTopOffset,
          input.outputHeight - input.badgeBottomOffset - renderedHeight
        );
        if (input.bottomBadges.length > 0) {
          bottomLimit = Math.min(
            bottomLimit,
            input.outputHeight - input.badgeBottomOffset - badgeHeight - rankingGap - renderedHeight
          );
        }
        if (lastOverlayTopY > 0) {
          const lowerCenterStackTop =
            lastPosterQualityTopY > 0 && lastPosterQualityTopY < lastOverlayTopY
              ? lastPosterQualityTopY
              : lastOverlayTopY;
          bottomLimit = Math.min(bottomLimit, lowerCenterStackTop - renderedHeight - overlapGap);
        }
        let nextTop = bottomLimit;
        const getRankingRect = (topValue: number): OverlayRect => ({
          left,
          top: topValue,
          width: renderedWidth,
          height: renderedHeight,
        });
        for (let guard = 0; guard < 8; guard += 1) {
          const rankingRect = getRankingRect(nextTop);
          const collidingRects = posterBlockingRects.filter((rect) => rectsOverlap(rankingRect, rect));
          if (collidingRects.length === 0) break;
          const belowTop = Math.max(
            nextTop,
            ...collidingRects.map((rect) => rect.top + rect.height + overlapGap)
          );
          if (belowTop <= bottomLimit) {
            nextTop = belowTop;
            continue;
          }
          nextTop = Math.min(
            nextTop,
            ...collidingRects.map((rect) => rect.top - renderedHeight - overlapGap)
          );
        }
        if (
          lastPosterQualityTopY > 0 &&
          nextTop < lastPosterQualityBottomY &&
          nextTop + renderedHeight > lastPosterQualityTopY
        ) {
          nextTop = Math.min(nextTop, lastPosterQualityTopY - renderedHeight - rankingGap);
        }
        return nextTop;
      };
      const rankingPosition = input.rankingPosition || 'auto';
      let top =
        rankingPosition === 'bottom'
          ? getBottomRankingTop()
          : rankingPosition === 'above-logo'
            ? getAboveLogoRankingTop()
            : getTopRankingTop();
      if (rankingPosition === 'auto' && lastOverlayTopY > 0) {
        top = Math.max(top, getAboveLogoRankingTop());
      }
      if (
        rankingPosition !== 'bottom' &&
        lastPosterQualityTopY > 0 &&
        top < lastPosterQualityBottomY &&
        top + renderedHeight > lastPosterQualityTopY
      ) {
        top = Math.max(input.badgeTopOffset, lastPosterQualityTopY - renderedHeight - rankingGap);
      }
      const rankingMinTop = Math.min(input.badgeTopOffset, Math.round(input.badgeTopOffset + (Math.min(posterQualityMaxHeight, posterReferenceBadgeHeight) - renderedHeight) / 2));
      const minTop = rankingMinTop;
      const maxTop = Math.max(minTop, input.outputHeight - input.badgeBottomOffset - renderedHeight);
      top = Math.max(minTop, Math.min(Math.round(top), maxTop));
      const topPositionMaxTop =
        rankingPosition === 'top' && lastOverlayTopY > 0
          ? Math.max(
            minTop,
            Math.min(
              maxTop,
              lastOverlayTopY - renderedHeight - Math.max(8, Math.round(posterReferenceBadgeGap * 0.9))
            )
          )
          : maxTop;
      const rankingMaxTop =
        rankingPosition === 'top' ? topPositionMaxTop : maxTop;
      const rankingGapForCollision = Math.max(4, Math.round(input.badgeGap * 0.45));
      const fitsRankingAt = (topValue: number) => {
        if (topValue < minTop || topValue > rankingMaxTop) return false;
        const rankingRect: OverlayRect = {
          left,
          top: topValue,
          width: renderedWidth,
          height: renderedHeight,
        };
        return !posterBlockingRects.some((rect) => rectsOverlap(rankingRect, rect));
      };
      const clampRankingTop = (topValue: number) =>
        Math.max(minTop, Math.min(Math.round(topValue), rankingMaxTop));
      const findRankingTop = (preferredTop: number, direction: 'up' | 'down') => {
        const startTop = clampRankingTop(preferredTop);
        if (fitsRankingAt(startTop)) return startTop;

        const primaryDelta = direction === 'up' ? -rankingGapForCollision : rankingGapForCollision;
        for (
          let candidateTop = startTop + primaryDelta;
          candidateTop >= minTop && candidateTop <= rankingMaxTop;
          candidateTop += primaryDelta
        ) {
          if (fitsRankingAt(candidateTop)) return candidateTop;
        }

        const secondaryDelta = -primaryDelta;
        for (
          let candidateTop = startTop + secondaryDelta;
          candidateTop >= minTop && candidateTop <= rankingMaxTop;
          candidateTop += secondaryDelta
        ) {
          if (fitsRankingAt(candidateTop)) return candidateTop;
        }

        const boundaryCandidates = [
          minTop,
          rankingMaxTop,
          ...posterBlockingRects.flatMap((rect) => [
            rect.top - renderedHeight - rankingGapForCollision,
            rect.top + rect.height + rankingGapForCollision,
          ]),
        ]
          .map(clampRankingTop)
          .sort((a, b) => Math.abs(a - startTop) - Math.abs(b - startTop));
        return boundaryCandidates.find(fitsRankingAt) ?? null;
      };
      const rankingSearchDirection =
        rankingPosition === 'bottom' ||
          rankingPosition === 'above-logo' ||
          (rankingPosition === 'auto' && lastOverlayTopY > 0)
          ? 'up'
          : 'down';
      const sameRowResult = trySameRowAsTopRatings() ?? trySameRowAsQuality();
      if (sameRowResult) {
        let useBuffer = rankingBuffer;
        let useWidth = renderedWidth;
        let useHeight = renderedHeight;
        if (sameRowResult.scaled) {
          const qualityHeight = lastPosterQualityBottomY - lastPosterQualityTopY;
          const targetHeight = Math.max(qualityHeight, Math.round(qualityHeight * 1.6));
          const heightScale = Math.min(1, targetHeight / renderedHeight);
          useWidth = Math.round(renderedWidth * heightScale);
          useHeight = Math.round(renderedHeight * heightScale);
          if (heightScale < 1) {
            useBuffer = await sharp(Buffer.from(rankingSpec.svg))
              .resize(useWidth, useHeight, { fit: 'fill' })
              .png()
              .toBuffer();
          }
        }
        const rowY = sameRowResult.scaled
          ? Math.max(0, lastPosterQualityTopY + Math.round((lastPosterQualityBottomY - lastPosterQualityTopY - useHeight) / 2))
          : sameRowResult.top;
        overlays.push({ input: useBuffer, top: rowY, left: sameRowResult.left });
        addPosterBlockingRect(sameRowResult.left, rowY, useWidth, useHeight);
        rankingPlacedSameRowAsQuality = sameRowResult.kind === 'quality';
        lastRankingRowLeft = sameRowResult.left;
        lastRankingRowRight = sameRowResult.left + useWidth;
        lastRankingRowTopY = rowY;
        lastRankingRowBottomY = rowY + useHeight;
        lastRankingPlacement = sameRowResult.kind === 'top' ? 'top' : lastPosterQualityPlacement;
      } else {
      const resolvedRankingTop = findRankingTop(top, rankingSearchDirection);
      if (resolvedRankingTop === null) {
        warnCollision(`Ranking badge "${badge.value}" could not avoid collision`);
      } else {
        top = resolvedRankingTop;
        overlays.push({ input: rankingBuffer, top, left });
        addPosterBlockingRect(left, top, renderedWidth, renderedHeight);
        lastRankingRowLeft = left;
        lastRankingRowRight = left + renderedWidth;
        lastRankingRowTopY = top;
        lastRankingRowBottomY = top + renderedHeight;
        const rankingPosRaw3 = input.rankingPosition || 'auto';
        lastRankingPlacement = rankingPosRaw3 === 'auto'
          ? (lastOverlayTopY > 0 ? 'above-logo' : 'top')
          : rankingPosRaw3;
      }
      }
    }

    composePosterGenreBadge();

    const background =
      input.imageType === 'logo'
        ? { r: 0, g: 0, b: 0, alpha: 0 }
        : { r: 17, g: 17, b: 17, alpha: 1 };

    let pipeline = baseImagePipeline || sharp({
      create: {
        width: input.outputWidth,
        height: input.finalOutputHeight,
        channels: 4,
        background,
      },
    });
    if (overlays.length > 0) {
      pipeline = pipeline.composite(overlays);
    }
    if (input.imageType === 'logo') {
      pipeline = pipeline.trim({ background: transparentBackground });
    }

    let finalBuffer: Buffer;
    let outputContentType = outputFormatToContentType(input.outputFormat);
    if (input.outputFormat === 'webp') {
      finalBuffer = await pipeline.webp({ quality: 80, effort: 3 }).toBuffer();
    } else if (input.outputFormat === 'jpeg') {
      finalBuffer = await pipeline.jpeg({ quality: 82 }).toBuffer();
    } else {
      finalBuffer = await pipeline.png({ compressionLevel: 1 }).toBuffer();
    }

    return {
      body: bufferToArrayBuffer(finalBuffer),
      contentType: outputContentType,
      cacheControl: input.cacheControl,
      collisionWarnings: Array.from(new Set(collisionWarnings)),
    };
  });
};

