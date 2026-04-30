// @ts-check

/**
 * GPU Detector - Detects hardware GPU tier before renderer initialization
 */

/**
 * @typedef {'low' | 'mid' | 'high' | 'ultra'} GpuTier
 */

/**
 * @typedef {'webgpu' | 'webgl' | 'fallback' | 'override'} DetectionSource
 */

/**
 * @typedef {{
 *   vendor: string | null,
 *   architecture: string | null,
 *   device: string | null,
 *   description: string | null,
 * }} AdapterInfo
 */

/**
 * @typedef {{
 *   webgpu: boolean,
 *   adapterInfo: AdapterInfo | null,
 *   glRenderer: string | null,
 *   glVendor: string | null,
 *   masked: boolean,
 * }} GpuCapabilities
 */

/**
 * @typedef {{
 *   hardwareConcurrency: number,
 *   deviceMemoryGB: number | null,
 *   devicePixelRatio: number,
 *   prefersReducedMotion: boolean,
 *   isMobileUA: boolean,
 * }} GpuSignals
 */

/**
 * @typedef {{
 *   dprCeiling: number,
 *   dprFloor: number,
 *   qualityScaleFloor: number,
 *   powerPreference: 'low-power' | 'default' | 'high-performance',
 *   antialias: boolean,
 * }} TierProfile
 */

/**
 * @typedef {{
 *   tier: GpuTier,
 *   source: DetectionSource,
 *   capabilities: GpuCapabilities,
 *   signals: GpuSignals,
 *   profile: TierProfile,
 * }} GpuTierResult
 */

/**
 * GPU classification patterns. First match wins.
 * Patterns cover both WebGPU `adapter.info.architecture` strings (e.g. "lovelace",
 * "ada", "ampere", "rdna3") and WebGL `UNMASKED_RENDERER_WEBGL` strings
 * (e.g. "ANGLE (NVIDIA, NVIDIA GeForce RTX 4080 ...)").
 * @type {Array<[RegExp, GpuTier]>}
 */
const GPU_PATTERNS = [
    // ── ultra ─────────────────────────────────────────────────────────────────
    // WebGPU architecture (NVIDIA Ada Lovelace = RTX 40xx)
    [/\b(lovelace|ada)\b/i,                        'ultra'],
    // AMD RDNA3 (RX 7000 series)
    [/\brdna[- ]?3\b/i,                            'ultra'],
    // WebGL renderer strings
    [/\bRTX [4-9]\d{3}\b/i,                        'ultra'],
    [/\bRX 7\d{3}\b/i,                             'ultra'],
    [/\bapple m[2-9]\b/i,                          'ultra'],
    [/\badreno[- ]?7[3-9]\d\b/i,                   'ultra'],

    // ── high ──────────────────────────────────────────────────────────────────
    // WebGPU architecture (Ampere = RTX 30xx, Turing = RTX 20xx, RDNA2 = RX 6000)
    [/\b(ampere|turing)\b/i,                       'high'],
    [/\brdna[- ]?2\b/i,                            'high'],
    // WebGL renderer strings
    [/\bRTX [12-3]\d{3}\b|\bGTX 1[6-9]\d{0}\b/i,  'high'],
    [/\bRX [56]\d{3}\b/i,                          'high'],
    [/\bapple m1\b|\bapple gpu\b/i,                'high'],
    [/\badreno[- ]?[67]\d{2}\b/i,                  'high'],
    [/\bmali-g7[7-9]\b/i,                          'high'],

    // ── mid ───────────────────────────────────────────────────────────────────
    // WebGPU architecture (Pascal = GTX 10xx, RDNA1 = RX 5000)
    [/\b(pascal|rdna[- ]?1)\b/i,                   'mid'],
    // WebGL renderer strings
    [/\bgtx 10\d{2}\b|\bgtx 9\d{2}\b/i,            'mid'],
    [/\bintel.+iris xe\b|\barc a\d{3}\b/i,         'mid'],
    [/\badreno[- ]?6[0-4]\d\b/i,                   'mid'],
    [/\bmali-g[57]\d\b/i,                          'mid'],
    [/\bintel.+(uhd|hd) graphics 6\d{2}\b/i,       'mid'],

    // ── low ───────────────────────────────────────────────────────────────────
    [/\bpowervr\b|\bmali-[34]\d{2}\b/i,            'low'],
    [/\bswiftshader\b|\bgoogle\b/i,                'low'],
];

/** @type {readonly GpuTier[]} */
const VALID_TIERS = /** @type {const} */ (['low', 'mid', 'high', 'ultra']);

export class GpuDetector {
    /** @type {GpuTierResult | null} */
    #result = null;

    /** @type {Promise<GpuTierResult> | null} */
    #inflight = null;

    /**
     * Runs GPU detection. Idempotent — second call returns the same frozen
     * result without re-querying the GPU.
     * @returns {Promise<GpuTierResult>}
     */
    async detect() {
        if (this.#result) return this.#result;
        if (this.#inflight) return this.#inflight;

        this.#inflight = this.#runDetection()
            .then((r) => {
                this.#result = r;
                return this.#result;
            })
            .finally(() => {
                this.#inflight = null;
            });

        return this.#inflight;
    }

    /**
     * Runs the full detection pipeline.
     * @returns {Promise<GpuTierResult>}
     */
    async #runDetection() {
        /** @type {GpuCapabilities} */
        const capabilities = {
            webgpu: false,
            adapterInfo: null,
            glRenderer: null,
            glVendor: null,
            masked: false,
        };

        /** @type {DetectionSource} */
        let source = 'fallback';

        /** @type {GpuTier | null} */
        let tierHint = null;

        // ── Task 7: URL override ──────────────────────────────────────────────
        const overrideTier = this._readTierOverride();
        if (overrideTier !== null) {
            const signals = this._collectSignals();
            const profile = this._buildProfile(overrideTier, signals);

            console.debug(`[GpuDetector] ?tier override: ${overrideTier}`);

            return Object.freeze({
                tier: overrideTier,
                source: /** @type {DetectionSource} */ ('override'),
                capabilities: Object.freeze(capabilities),
                signals: Object.freeze(signals),
                profile: Object.freeze(profile),
            });
        }

        // ── Task 2: WebGPU branch ─────────────────────────────────────────────
        /** @type {any} */
        const nav = typeof navigator !== 'undefined' ? navigator : null;
        if (nav && nav.gpu) {
            try {
                const adapter = await nav.gpu.requestAdapter({ powerPreference: 'high-performance' });
                if (adapter) {
                    capabilities.webgpu = true;
                    source = 'webgpu';

                    // adapter.info is Chrome 113+ — may not exist on all browsers
                    const info = /** @type {any} */ (adapter).info;
                    if (info) {
                        capabilities.adapterInfo = {
                            vendor: info.vendor ?? null,
                            architecture: info.architecture ?? null,
                            device: info.device ?? null,
                            description: info.description ?? null,
                        };

                        // SwiftShader (Google software renderer) → force low
                        if (typeof info.vendor === 'string' && info.vendor.toLowerCase() === 'google') {
                            tierHint = 'low';
                        }
                    }

                    console.debug('[GpuDetector] WebGPU adapter info:', capabilities.adapterInfo);
                }
            } catch (e) {
                capabilities.webgpu = false;
                console.debug('[GpuDetector] WebGPU detection failed:', e);
            }
        }

        // ── Task 3: WebGL WEBGL_debug_renderer_info branch ────────────────────
        try {
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = 1;
            offscreenCanvas.height = 1;
            const gl = /** @type {WebGLRenderingContext | null} */ (
                offscreenCanvas.getContext('webgl2') || offscreenCanvas.getContext('webgl')
            );

            if (gl) {
                if (source === 'fallback') source = 'webgl';

                const ext = gl.getExtension('WEBGL_debug_renderer_info');
                if (ext) {
                    const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
                    const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
                    capabilities.glRenderer = typeof renderer === 'string' ? renderer : null;
                    capabilities.glVendor = typeof vendor === 'string' ? vendor : null;

                    // Detect masked strings (Firefox privacy mode)
                    const lowerRenderer = (capabilities.glRenderer ?? '').toLowerCase();
                    if (
                        lowerRenderer === 'mozilla' ||
                        lowerRenderer === '' ||
                        lowerRenderer === 'angle (google, swiftshader)'
                    ) {
                        capabilities.masked = true;
                    }
                }

                // Release context best-effort
                const loseExt = gl.getExtension('WEBGL_lose_context');
                if (loseExt) loseExt.loseContext();
            }

            console.debug('[GpuDetector] WebGL renderer:', capabilities.glRenderer);
        } catch (e) {
            console.debug('[GpuDetector] WebGL detection failed:', e);
        }

        // ── Task 4: Always collect signals ───────────────────────────────────
        const signals = this._collectSignals();

        // ── Task 5: Classify tier ─────────────────────────────────────────────
        // Try ALL available signals and keep the highest tier found. WebGL
        // renderer string is usually the most specific (e.g. "RTX 4080") so it
        // tends to win over WebGPU's `architecture` ("lovelace") which only
        // gives microarchitecture family. Both are evaluated regardless of
        // detection source — adapter.info.architecture matters when WebGL is
        // unavailable, and renderer matters when adapter.info.description is empty.
        /** @type {GpuTier} */
        let tier = 'mid';

        if (tierHint !== null) {
            // SwiftShader / Google vendor forced low — overrides everything
            tier = tierHint;
        } else {
            /** @type {Array<GpuTier | null>} */
            const candidates = [];

            if (capabilities.adapterInfo) {
                candidates.push(this._classifyByString(capabilities.adapterInfo.architecture ?? ''));
                candidates.push(this._classifyByString(capabilities.adapterInfo.description ?? ''));
                candidates.push(this._classifyByString(capabilities.adapterInfo.device ?? ''));
            }

            if (capabilities.glRenderer && !capabilities.masked) {
                candidates.push(this._classifyByString(capabilities.glRenderer));
            }

            const best = this._highestTier(candidates);
            tier = best ?? this._classifyBySignals(signals);
        }

        // ── Task 6: Build profile ─────────────────────────────────────────────
        const profile = this._buildProfile(tier, signals);

        console.debug(`[GpuDetector] Detected tier: ${tier} (source: ${source})`);

        /** @type {GpuTierResult} */
        const result = {
            tier,
            source,
            capabilities: Object.freeze(capabilities),
            signals: Object.freeze(signals),
            profile: Object.freeze(profile),
        };

        return Object.freeze(result);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Reads ?tier= URL param. Returns valid tier or null.
     * @returns {GpuTier | null}
     */
    _readTierOverride() {
        try {
            const raw = new URLSearchParams(location.search).get('tier');
            if (raw && /** @type {string[]} */ (VALID_TIERS).includes(raw)) {
                return /** @type {GpuTier} */ (raw);
            }
        } catch {
            // Ignore
        }
        return null;
    }

    /**
     * Collects hardware/UA signals unconditionally.
     * @returns {GpuSignals}
     */
    _collectSignals() {
        return {
            hardwareConcurrency: (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4,
            deviceMemoryGB: (typeof navigator !== 'undefined' && /** @type {any} */ (navigator).deviceMemory) ?? null,
            devicePixelRatio: (typeof window !== 'undefined' && window.devicePixelRatio) || 1,
            prefersReducedMotion: (
                typeof window !== 'undefined' &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches
            ),
            isMobileUA: (
                typeof navigator !== 'undefined' &&
                /Mobile|Android/i.test(navigator.userAgent)
            ),
        };
    }

    /**
     * Classifies a GPU string against the lookup table.
     * Returns first matching tier or null.
     * @param {string} str
     * @returns {GpuTier | null}
     */
    _classifyByString(str) {
        if (!str) return null;
        for (const [pattern, tier] of GPU_PATTERNS) {
            if (pattern.test(str)) return tier;
        }
        return null;
    }

    /**
     * Classifies based on hardware signals when GPU strings are unavailable.
     * @param {GpuSignals} signals
     * @returns {GpuTier}
     */
    _classifyBySignals(signals) {
        if (signals.hardwareConcurrency >= 8 && signals.deviceMemoryGB !== null && signals.deviceMemoryGB >= 8) {
            return 'mid';
        }
        if (signals.hardwareConcurrency >= 4) return 'mid';
        return 'low';
    }

    /**
     * Picks the highest tier from a list of candidates (nulls ignored).
     * Returns null if all candidates are null.
     * @param {Array<GpuTier | null>} candidates
     * @returns {GpuTier | null}
     */
    _highestTier(candidates) {
        /** @type {Record<GpuTier, number>} */
        const RANK = { low: 0, mid: 1, high: 2, ultra: 3 };
        /** @type {GpuTier | null} */
        let best = null;
        for (const c of candidates) {
            if (c === null) continue;
            if (best === null || RANK[c] > RANK[best]) best = c;
        }
        return best;
    }

    /**
     * Builds a frozen tier profile from tier + signals.
     * Applies prefers-reduced-motion override if needed.
     * @param {GpuTier} tier
     * @param {GpuSignals} signals
     * @returns {TierProfile}
     */
    _buildProfile(tier, signals) {
        /** @type {Record<GpuTier, TierProfile>} */
        const TABLE = {
            low:   { dprCeiling: 1.0, dprFloor: 0.6, qualityScaleFloor: 0.6, powerPreference: 'low-power',        antialias: false },
            mid:   { dprCeiling: 1.5, dprFloor: 0.75, qualityScaleFloor: 0.75, powerPreference: 'default',         antialias: false },
            high:  { dprCeiling: 2.0, dprFloor: 1.0, qualityScaleFloor: 0.85, powerPreference: 'high-performance', antialias: true  },
            ultra: { dprCeiling: 3.0, dprFloor: 1.0, qualityScaleFloor: 0.9,  powerPreference: 'high-performance', antialias: true  },
        };

        // Fallback to mid for unknown tier strings
        const base = TABLE[tier] ?? TABLE['mid'];

        /** @type {TierProfile} */
        let profile = { ...base };

        // Task 8: prefers-reduced-motion overrides profile (but preserves tier)
        if (signals.prefersReducedMotion) {
            profile = {
                ...profile,
                dprCeiling: 1.0,
                qualityScaleFloor: 0.6,
                powerPreference: 'low-power',
                antialias: false,
            };
            console.debug(
                `[GpuDetector] tier=${tier} — profile overridden by prefers-reduced-motion`,
            );
        }

        return profile;
    }
}
