import { Check, Download, X } from 'lucide-react';
import { useState } from 'react';

interface SnapshotModalProps {
  imageDataUrl: string | null;
  finishName: string;
  scaleName: string;
  onClose: () => void;
}

export function SnapshotModal({
  imageDataUrl,
  finishName,
  scaleName,
  onClose,
}: SnapshotModalProps) {
  const [downloaded, setDownloaded] = useState(false);

  if (!imageDataUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = `aurelia-thien-van-co-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 2400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="snapshot-modal-title"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/82 p-4 sm:p-6"
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-xl border border-white/14 bg-[#10121a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2
              id="snapshot-modal-title"
              className="font-display text-2xl font-semibold tracking-wide text-[#f3efe6]"
            >
              Ảnh Trưng Bày AURELIA
            </h2>
            <p className="mt-0.5 text-xs text-[#f3efe6]/60">
              {finishName} · Âm giai {scaleName} · PNG 1440×960
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ xem ảnh"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 text-[#f3efe6]/75 transition-colors hover:bg-white/10 hover:text-[#f3efe6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6c670]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="bg-[#08090d] p-4 sm:p-6">
          <img
            src={imageDataUrl}
            alt="Ảnh chụp góc nhìn 3D Đại Thiên Văn Cơ AURELIA"
            className="w-full rounded-lg border border-white/10 object-contain"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
          <p className="text-xs text-[#f3efe6]/62">
            Tải ảnh độ phân giải cao có đóng khung triển lãm để chia sẻ với bạn bè.
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] rounded-lg border border-white/14 px-4 py-2 text-xs font-medium text-[#f3efe6]/80 transition-colors hover:bg-white/8 hover:text-[#f3efe6] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e6c670]"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#e6c670] px-4 py-2 text-xs font-semibold text-[#0c0d12] transition-colors hover:bg-[#f0d588] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {downloaded ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>Đã tải xuống</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>Tải ảnh PNG</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
