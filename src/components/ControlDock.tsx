import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Music,
  Pause,
  Play,
  Rewind,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import {
  CAMERA_PRESET_LIST,
  CameraPresetId,
  FINISH_LIST,
  FinishId,
  getNoteForPlanet,
  PLANETS,
  SCALE_LIST,
  ScaleId,
} from '../engine/orreryMath';

interface ControlDockProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  exploded: number;
  onExplodedChange: (value: number) => void;
  finishId: FinishId;
  onFinishChange: (id: FinishId) => void;
  scaleId: ScaleId;
  onScaleChange: (id: ScaleId) => void;
  cameraPreset: CameraPresetId;
  onCameraPresetChange: (id: CameraPresetId) => void;
  timeScale: number;
  onTimeScaleChange: (value: number) => void;
  domeVisible: boolean;
  onToggleDome: () => void;
  activePlanetIdx: number | null;
  onPluckPlanet: (index: number) => void;
  onPlayCascade: () => void;
}

const SPEED_OPTIONS = [
  { value: -1, label: 'Đảo ngược' },
  { value: 0, label: 'Tạm dừng' },
  { value: 1, label: '1×' },
  { value: 2.2, label: '2×' },
] as const;

export function ControlDock({
  collapsed,
  onToggleCollapsed,
  exploded,
  onExplodedChange,
  finishId,
  onFinishChange,
  scaleId,
  onScaleChange,
  cameraPreset,
  onCameraPresetChange,
  timeScale,
  onTimeScaleChange,
  domeVisible,
  onToggleDome,
  activePlanetIdx,
  onPluckPlanet,
  onPlayCascade,
}: ControlDockProps) {
  const [mobileTab, setMobileTab] = useState<'mechanics' | 'music'>('mechanics');
  const explodedPct = Math.round(exploded * 100);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col items-center px-3 pb-3 sm:px-5 sm:pb-4"
      data-testid="control-dock-wrapper"
    >
      {/* Collapse / Expand Cinema Mode Tab */}
      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Mở bảng điều khiển' : 'Ẩn bảng điều khiển'}
        className="pointer-events-auto mb-1 inline-flex min-h-[34px] items-center gap-1.5 rounded-t-lg border border-b-0 border-white/12 bg-[#0d0f16]/95 px-3.5 py-1 text-xs font-medium text-[#f3efe6]/82 transition-colors hover:bg-[#171a26] hover:text-[#f3efe6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6c670] whitespace-nowrap shrink-0"
      >
        {collapsed ? (
          <>
            <ChevronUp className="h-3.5 w-3.5 text-[#e6c670]" aria-hidden="true" />
            <span>Mở điều khiển</span>
          </>
        ) : (
          <>
            <ChevronDown className="h-3.5 w-3.5 text-[#e6c670]" aria-hidden="true" />
            <span>Ẩn điều khiển</span>
          </>
        )}
      </button>

      {/* Unified Bottom Control Dock (solid dark rgba, zero backdrop-filter over WebGL) */}
      <section
        aria-label="Bảng điều khiển cỗ máy thiên văn"
        className={`pointer-events-auto w-full max-w-[1060px] rounded-xl border border-white/12 bg-[#0d0f16]/95 px-3.5 py-3 shadow-2xl transition-all duration-200 ease-out sm:px-5 ${
          collapsed
            ? 'pointer-events-none max-h-0 translate-y-[115%] overflow-hidden border-transparent py-0 opacity-0'
            : 'translate-y-0 opacity-100'
        }`}
      >
        {/* Mobile Compact Section Switcher (keeps mobile dock low-profile) */}
        <div
          className="mb-2.5 grid grid-cols-2 gap-1 rounded-lg bg-white/5 p-1 md:hidden"
          role="tablist"
          aria-label="Nhóm điều khiển di động"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'mechanics'}
            onClick={() => setMobileTab('mechanics')}
            className={`min-h-[34px] rounded-md px-2 text-xs font-medium transition-colors whitespace-nowrap ${
              mobileTab === 'mechanics'
                ? 'bg-[#e6c670] text-[#0c0d12]'
                : 'text-[#f3efe6]/70'
            }`}
          >
            Cơ khí &amp; Góc máy
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileTab === 'music'}
            onClick={() => setMobileTab('music')}
            className={`min-h-[34px] rounded-md px-2 text-xs font-medium transition-colors whitespace-nowrap ${
              mobileTab === 'music'
                ? 'bg-[#e6c670] text-[#0c0d12]'
                : 'text-[#f3efe6]/70'
            }`}
          >
            Hộp nhạc &amp; Hành tinh
          </button>
        </div>

        {/* Row 1: Primary Mechanical & Aesthetic Controls */}
        <div
          className={`grid-cols-1 gap-3 md:grid md:grid-cols-12 md:items-center ${
            mobileTab === 'mechanics' ? 'grid' : 'hidden md:grid'
          }`}
        >
          {/* Exploded View Slider */}
          <div className="md:col-span-2">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <label
                htmlFor="exploded-view-slider"
                className="font-medium text-[#f3efe6]/85 whitespace-nowrap"
              >
                Tách lớp
              </label>
              <span className="font-mono text-[11px] tabular-nums text-[#e6c670]">
                {explodedPct}%
              </span>
            </div>
            <input
              id="exploded-view-slider"
              type="range"
              min={0}
              max={100}
              step={1}
              value={explodedPct}
              onChange={(e) => onExplodedChange(Number(e.target.value) / 100)}
              className="aurelia-slider w-full"
            />
          </div>

          {/* Material Finish Swatches + Sapphire Dome Toggle */}
          <div className="md:col-span-3 md:border-l md:border-white/10 md:pl-3.5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-[#f3efe6]/85">Chất liệu</span>
              <span className="truncate text-[11px] text-[#f3efe6]/55">
                {FINISH_LIST.find((f) => f.id === finishId)?.shortName}
              </span>
            </div>
            <div
              className="flex items-center gap-1.5"
              role="radiogroup"
              aria-label="Chọn chất liệu chế tác"
            >
              {FINISH_LIST.map((finish) => {
                const active = finish.id === finishId;
                return (
                  <button
                    key={finish.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={`Chất liệu ${finish.name}`}
                    title={finish.name}
                    onClick={() => onFinishChange(finish.id)}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6c670] ${
                      active
                        ? 'border-[#e6c670] ring-2 ring-[#e6c670]/35'
                        : 'border-white/18 hover:border-white/40'
                    }`}
                    style={{ backgroundColor: finish.accentSwatchHex }}
                  >
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: finish.swatchHex }}
                    />
                  </button>
                );
              })}
              <button
                type="button"
                onClick={onToggleDome}
                aria-pressed={domeVisible}
                aria-label={domeVisible ? 'Ẩn vòm kính sapphire' : 'Hiện vòm kính sapphire'}
                title={domeVisible ? 'Ẩn vòm kính' : 'Hiện vòm kính'}
                className={`ml-auto inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6c670] ${
                  domeVisible
                    ? 'border-white/15 bg-white/6 text-[#f3efe6]/85 hover:bg-white/12'
                    : 'border-[#e6c670]/45 bg-[#e6c670]/14 text-[#e6c670]'
                }`}
              >
                {domeVisible ? (
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>Vòm</span>
              </button>
            </div>
          </div>

          {/* Camera Presets (wide 5 cols so every Vietnamese label sits on 1 spacious line) */}
          <div className="md:col-span-5 md:border-l md:border-white/10 md:pl-3.5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-[#f3efe6]/85">Góc máy</span>
              <span className="hidden text-[11px] text-[#f3efe6]/48 sm:inline">
                Kéo chuột để xoay 360°
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 rounded-lg bg-white/5 p-1">
              {CAMERA_PRESET_LIST.map((preset) => {
                const active = preset.id === cameraPreset;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onCameraPresetChange(preset.id)}
                    className={`min-h-[32px] rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6c670] sm:px-2 sm:text-xs ${
                      active
                        ? 'bg-[#e6c670] text-[#0c0d12]'
                        : 'text-[#f3efe6]/75 hover:bg-white/8 hover:text-[#f3efe6]'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Speed Control */}
          <div className="md:col-span-2 md:border-l md:border-white/10 md:pl-3.5">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-[#f3efe6]/85">Tốc độ</span>
              <span className="font-mono text-[11px] tabular-nums text-[#f3efe6]/60">
                {timeScale === 0
                  ? 'Dừng'
                  : timeScale < 0
                    ? '-1×'
                    : `${timeScale.toFixed(1).replace('.0', '')}×`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 rounded-lg bg-white/5 p-1">
              {SPEED_OPTIONS.map((opt) => {
                const active = Math.abs(timeScale - opt.value) < 0.05;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    aria-label={`Tốc độ ${opt.label}`}
                    onClick={() => onTimeScaleChange(opt.value)}
                    className={`flex min-h-[32px] items-center justify-center rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6c670] ${
                      active
                        ? 'bg-[#e6c670] text-[#0c0d12]'
                        : 'text-[#f3efe6]/75 hover:bg-white/8 hover:text-[#f3efe6]'
                    }`}
                  >
                    {opt.value === -1 ? (
                      <Rewind className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : opt.value === 0 ? (
                      <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : opt.value === 1 ? (
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <span className="font-mono text-[11px]">2×</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hairline Divider (Desktop only) */}
        <div className="my-2.5 hidden h-px w-full bg-white/8 md:block" />

        {/* Row 2: Interactive Harmonic Music Box Keys & Scale Selector */}
        <div
          className={`flex-col gap-2.5 md:flex md:flex-row md:items-center md:justify-between ${
            mobileTab === 'music' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Musical Scale Tabs + Cascade Trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="flex items-center gap-0.5 rounded-lg bg-white/5 p-1"
              role="tablist"
              aria-label="Chọn âm giai hòa âm"
            >
              {SCALE_LIST.map((scale) => {
                const active = scale.id === scaleId;
                return (
                  <button
                    key={scale.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onScaleChange(scale.id)}
                    className={`min-h-[30px] rounded-md px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6c670] sm:text-xs ${
                      active
                        ? 'bg-white/16 text-[#f8f3e3]'
                        : 'text-[#f3efe6]/62 hover:text-[#f3efe6]'
                    }`}
                  >
                    {scale.name}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onPlayCascade}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[#e6c670]/42 bg-[#e6c670]/12 px-2.5 py-1 text-xs font-semibold text-[#f3dc98] transition-colors hover:bg-[#e6c670]/22 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6c670]"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Hòa tấu</span>
            </button>
          </div>

          {/* 6 Clickable Planetary Harmonic Keys (zero clipping on desktop, clean 3x2 grid on mobile) */}
          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-1.5">
            <Music
              className="mr-0.5 hidden h-3.5 w-3.5 shrink-0 text-[#f3efe6]/45 lg:block"
              aria-hidden="true"
            />
            {PLANETS.map((planet, idx) => {
              const { noteName } = getNoteForPlanet(idx, scaleId);
              const isStruck = activePlanetIdx === idx;
              return (
                <button
                  key={planet.id}
                  type="button"
                  onClick={() => onPluckPlanet(idx)}
                  aria-label={`Gảy nốt ${noteName} của ${planet.name}`}
                  className={`inline-flex min-h-[32px] items-center justify-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] transition-all whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6c670] sm:text-xs ${
                    isStruck
                      ? 'border-[#e6c670] bg-[#e6c670]/22 text-[#fff6da]'
                      : 'border-white/10 bg-white/4 text-[#f3efe6]/82 hover:border-white/25 hover:bg-white/10'
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: planet.swatchHex }}
                    aria-hidden="true"
                  />
                  <span className="font-medium">{planet.shortName}</span>
                  <span className="font-mono text-[10px] text-[#f3efe6]/52">{noteName}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
