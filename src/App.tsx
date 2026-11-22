import { Camera, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ControlDock } from './components/ControlDock';
import { OrreryViewport, OrreryViewportHandle } from './components/OrreryViewport';
import { SnapshotModal } from './components/SnapshotModal';
import { CelestialAudioEngine } from './engine/audioEngine';
import {
  CameraPresetId,
  FINISHES,
  FinishId,
  getNoteForPlanet,
  PLANETS,
  SCALES,
  ScaleId,
} from './engine/orreryMath';

export default function App() {
  const viewportRef = useRef<OrreryViewportHandle | null>(null);
  const audioRef = useRef<CelestialAudioEngine | null>(null);
  const strikeTimerRef = useRef<number | null>(null);

  const [finishId, setFinishId] = useState<FinishId>('hoang-kim');
  const [scaleId, setScaleId] = useState<ScaleId>('ngu-cung');
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('overview');
  const [exploded, setExploded] = useState<number>(0);
  const [timeScale, setTimeScale] = useState<number>(1);
  const [domeVisible, setDomeVisible] = useState<boolean>(true);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  const [hoveredPlanetIdx, setHoveredPlanetIdx] = useState<number | null>(null);
  const [activePlanetIdx, setActivePlanetIdx] = useState<number | null>(null);
  const [chimeCount, setChimeCount] = useState<number>(0);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  const scaleRef = useRef(scaleId);
  scaleRef.current = scaleId;

  // Lazy-init audio engine once & clean up on unmount
  useEffect(() => {
    const engine = new CelestialAudioEngine();
    audioRef.current = engine;
    return () => {
      engine.dispose();
      audioRef.current = null;
      if (strikeTimerRef.current) window.clearTimeout(strikeTimerRef.current);
    };
  }, []);

  // Keyboard shortcuts: H toggles Cinema Mode, Space pauses/resumes, 1-6 plucks planets
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      } else if (e.code === 'Space') {
        e.preventDefault();
        setTimeScale((prev) => (Math.abs(prev) < 0.05 ? 1 : 0));
      } else if (e.key >= '1' && e.key <= '6') {
        const idx = Number(e.key) - 1;
        if (audioRef.current && !audioRef.current.isEnabled()) {
          audioRef.current.unlock();
          setAudioEnabled(true);
        }
        viewportRef.current?.pluckPlanet(idx);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const flashActivePlanet = useCallback((planetIndex: number) => {
    setActivePlanetIdx(planetIndex);
    setChimeCount((c) => c + 1);
    if (strikeTimerRef.current) window.clearTimeout(strikeTimerRef.current);
    strikeTimerRef.current = window.setTimeout(() => {
      setActivePlanetIdx(null);
    }, 850);
  }, []);

  const handlePlanetChime = useCallback(
    (planetIndex: number, manual: boolean) => {
      if (manual && audioRef.current && !audioRef.current.isEnabled()) {
        const ok = audioRef.current.unlock();
        if (ok) setAudioEnabled(true);
      }
      audioRef.current?.playPlanetNote(planetIndex, scaleRef.current, manual ? 0.9 : 0.68);
      flashActivePlanet(planetIndex);
    },
    [flashActivePlanet]
  );

  const handleToggleAudio = () => {
    const engine = audioRef.current;
    if (!engine) return;
    const next = !audioEnabled;
    const result = engine.setEnabled(next);
    setAudioEnabled(result);
    if (result) {
      // Reward user with a welcoming harmonic note immediately on activation
      viewportRef.current?.pluckPlanet(2);
    }
  };

  const handlePluckPlanet = (index: number) => {
    viewportRef.current?.pluckPlanet(index);
  };

  const handlePlayCascade = () => {
    const engine = audioRef.current;
    if (!engine) return;
    if (!engine.isEnabled()) {
      const ok = engine.unlock();
      if (ok) setAudioEnabled(true);
    }
    engine.playChordCascade(scaleId, (idx) => {
      viewportRef.current?.pluckPlanet(idx);
    });
  };

  const handleCameraPresetChange = (id: CameraPresetId) => {
    setCameraPreset(id);
    viewportRef.current?.focusCameraPreset(id);
  };

  const handleCapturePoster = () => {
    const finishName = FINISHES[finishId].name;
    const scaleName = SCALES[scaleId].name;
    const url = viewportRef.current?.captureStudioPoster(finishName, scaleName);
    if (url) {
      setSnapshotUrl(url);
    }
  };

  const inspectedIdx = hoveredPlanetIdx ?? activePlanetIdx;
  const inspectedPlanet = inspectedIdx !== null ? PLANETS[inspectedIdx] : null;
  const inspectedNote =
    inspectedIdx !== null ? getNoteForPlanet(inspectedIdx, scaleId) : null;

  return (
    <main
      className="relative h-screen w-screen overflow-hidden bg-[#08090d] text-[#f3efe6]"
      data-finish={finishId}
      data-scale={scaleId}
      data-camera={cameraPreset}
      data-exploded={Math.round(exploded * 100)}
      data-chimes={chimeCount}
    >
      {/* Full-Viewport 3D Mechanical Orrery Canvas (100% Unobstructed Center) */}
      <OrreryViewport
        ref={viewportRef}
        finishId={finishId}
        scaleId={scaleId}
        exploded={exploded}
        timeScale={timeScale}
        domeVisible={domeVisible}
        onPlanetChime={handlePlanetChime}
        onPlanetHover={setHoveredPlanetIdx}
      />

      {/* Minimal Top Bar: Editorial Title Left + Primary Utility Actions Right */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-center justify-between gap-2 px-3.5 pt-3.5 sm:items-start sm:gap-4 sm:px-7 sm:pt-6">
        <div className="pointer-events-auto min-w-0 select-none">
          <h1 className="font-display text-xl font-semibold tracking-[0.18em] text-[#f6f1e4] sm:text-3xl sm:tracking-[0.22em] whitespace-nowrap">
            AURELIA
          </h1>
          <p className="mt-0.5 truncate text-[11px] text-[#f3efe6]/62 sm:text-[13px]">
            Đại Thiên Văn Cơ · Hộp Nhạc 3D
          </p>
        </div>

        {/* Dynamic quiet inline readout when hovering or striking a planet */}
        <div
          aria-live="polite"
          className={`hidden items-center gap-2.5 rounded-lg border border-white/10 bg-[#0d0f16]/92 px-3.5 py-2 text-xs transition-opacity duration-200 lg:flex ${
            inspectedPlanet ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {inspectedPlanet && inspectedNote && (
            <>
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: inspectedPlanet.swatchHex }}
                aria-hidden="true"
              />
              <span className="font-semibold text-[#f6f1e4]">{inspectedPlanet.name}</span>
              <span aria-hidden="true" className="text-[#f3efe6]/35">
                ·
              </span>
              <span className="text-[#f3efe6]/68">{inspectedPlanet.subtitle}</span>
              <span aria-hidden="true" className="text-[#f3efe6]/35">
                ·
              </span>
              <span className="font-mono tabular-nums text-[#e6c670]">
                {inspectedNote.noteName} ({Math.round(inspectedNote.frequency)} Hz)
              </span>
            </>
          )}
        </div>

        {/* Top-Right Compact Primary Actions */}
        <div className="pointer-events-auto flex items-center gap-1.5 shrink-0 sm:gap-2">
          <button
            type="button"
            onClick={handleToggleAudio}
            aria-pressed={audioEnabled}
            aria-label={audioEnabled ? 'Tắt âm thanh hộp nhạc' : 'Bật âm thanh hộp nhạc'}
            className={`inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6c670] sm:min-h-[40px] sm:gap-2 sm:px-3.5 sm:py-2 ${
              audioEnabled
                ? 'border-[#e6c670]/55 bg-[#e6c670]/18 text-[#f8e6b0] hover:bg-[#e6c670]/25'
                : 'border-white/14 bg-[#0d0f16]/92 text-[#f3efe6]/85 hover:bg-[#171a26]'
            }`}
          >
            {audioEnabled ? (
              <Volume2 className="h-4 w-4 text-[#e6c670]" aria-hidden="true" />
            ) : (
              <VolumeX className="h-4 w-4 text-[#f3efe6]/60" aria-hidden="true" />
            )}
            <span className="hidden sm:inline">
              {audioEnabled ? 'Đang phát nhạc' : 'Bật âm thanh'}
            </span>
            <span className="sm:hidden">{audioEnabled ? 'Bật' : 'Nhạc'}</span>
          </button>

          <button
            type="button"
            onClick={handleCapturePoster}
            aria-label="Chụp ảnh trưng bày AURELIA để chia sẻ"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#e6c670] px-2.5 py-1.5 text-xs font-semibold text-[#0c0d12] transition-colors hover:bg-[#f1d88f] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:min-h-[40px] sm:gap-2 sm:px-3.5 sm:py-2"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Chụp ảnh khoe</span>
            <span className="sm:hidden">Chụp</span>
          </button>
        </div>
      </header>

      {/* Collapsible Unified Bottom Control Dock */}
      <ControlDock
        collapsed={dockCollapsed}
        onToggleCollapsed={() => setDockCollapsed((v) => !v)}
        exploded={exploded}
        onExplodedChange={setExploded}
        finishId={finishId}
        onFinishChange={setFinishId}
        scaleId={scaleId}
        onScaleChange={setScaleId}
        cameraPreset={cameraPreset}
        onCameraPresetChange={handleCameraPresetChange}
        timeScale={timeScale}
        onTimeScaleChange={setTimeScale}
        domeVisible={domeVisible}
        onToggleDome={() => setDomeVisible((v) => !v)}
        activePlanetIdx={activePlanetIdx}
        onPluckPlanet={handlePluckPlanet}
        onPlayCascade={handlePlayCascade}
      />

      {/* High-Res Exhibition Poster Modal */}
      <SnapshotModal
        imageDataUrl={snapshotUrl}
        finishName={FINISHES[finishId].name}
        scaleName={SCALES[scaleId].name}
        onClose={() => setSnapshotUrl(null)}
      />
    </main>
  );
}
