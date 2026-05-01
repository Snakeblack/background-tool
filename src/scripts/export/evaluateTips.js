/**
 * evaluateTips — pure function, no DOM dependencies.
 * GPU tier is numeric: 0=low, 1=mid, 2=high, 3=ultra (mapped in main.js via GPU_TIER_MAP).
 */

/**
 * @typedef {Object} TipEvidence
 * @property {string} metric
 * @property {number|string} value
 */

/**
 * @typedef {Object} Tip
 * @property {string} id
 * @property {'info'|'warning'|'critical'} severity
 * @property {string} titleKey
 * @property {string} descriptionKey
 * @property {string} suggestionKey
 * @property {TipEvidence[]} evidence
 */

/** FPS below this threshold triggers a warning tip. */
const FPS_WARNING_THRESHOLD = 45;

/**
 * GPU tiers at or below this value are considered low-end (0=low, 1=mid).
 * Matches the GPU_TIER_MAP in main.js: { low: 0, mid: 1, high: 2, ultra: 3 }.
 */
const LOW_TIER_MAX = 1;

/**
 * Evaluates contextual performance tips based on the current runtime.
 *
 * @param {{
 *   gpuTier: number | null,
 *   observedFps: number,
 *   isMobile: boolean,
 *   prefersReducedMotion: boolean,
 *   shaderComplexity?: 'simple' | 'medium' | 'complex'
 * }} context
 * @returns {Tip[]}
 */
export function evaluateTips(context) {
    const tips = [];
    const { gpuTier, observedFps, isMobile, prefersReducedMotion, shaderComplexity } = context;

    // critical: low/mid GPU + complex shader
    if (gpuTier !== null && gpuTier !== undefined && gpuTier <= LOW_TIER_MAX && shaderComplexity === 'complex') {
        tips.push({
            id: 'low-tier-complex-shader',
            severity: 'critical',
            titleKey: 'export.tips.lowTierComplex.title',
            descriptionKey: 'export.tips.lowTierComplex.description',
            suggestionKey: 'export.tips.lowTierComplex.suggestion',
            evidence: [
                { metric: 'gpuTier', value: gpuTier },
                { metric: 'shader', value: shaderComplexity },
            ],
        });
    }

    // warning: low observed FPS
    if (observedFps > 0 && observedFps < FPS_WARNING_THRESHOLD) {
        tips.push({
            id: 'low-fps',
            severity: 'warning',
            titleKey: 'export.tips.lowFps.title',
            descriptionKey: 'export.tips.lowFps.description',
            suggestionKey: 'export.tips.lowFps.suggestion',
            evidence: [{ metric: 'fps', value: observedFps }],
        });
    }

    // info: mobile device
    if (isMobile) {
        tips.push({
            id: 'mobile-fullscreen',
            severity: 'info',
            titleKey: 'export.tips.mobile.title',
            descriptionKey: 'export.tips.mobile.description',
            suggestionKey: 'export.tips.mobile.suggestion',
            evidence: [{ metric: 'platform', value: 'mobile' }],
        });
    }

    // info: prefers-reduced-motion
    if (prefersReducedMotion) {
        tips.push({
            id: 'prefers-reduced-motion',
            severity: 'info',
            titleKey: 'export.tips.reducedMotion.title',
            descriptionKey: 'export.tips.reducedMotion.description',
            suggestionKey: 'export.tips.reducedMotion.suggestion',
            evidence: [{ metric: 'media', value: 'prefers-reduced-motion: reduce' }],
        });
    }

    // info (positive): ultra-tier with stable FPS and no critical issues
    if (
        gpuTier !== null &&
        gpuTier !== undefined &&
        gpuTier >= 3 &&
        observedFps >= 60 &&
        !tips.some(t => t.severity === 'critical')
    ) {
        tips.push({
            id: 'ultra-tier-stable',
            severity: 'info',
            titleKey: 'export.tips.ultraStable.title',
            descriptionKey: 'export.tips.ultraStable.description',
            suggestionKey: 'export.tips.ultraStable.suggestion',
            evidence: [
                { metric: 'gpuTier', value: gpuTier },
                { metric: 'fps', value: observedFps },
            ],
        });
    }

    return tips;
}
