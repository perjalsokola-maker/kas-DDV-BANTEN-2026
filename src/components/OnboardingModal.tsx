import { ArrowUpRight } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export function OnboardingModal({ isOpen, onDismiss }: OnboardingModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-lime-accent flex items-center justify-center p-5 sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Pembuka Kas DDV Banten 2026"
    >
      <div className="w-full max-w-md flex flex-col justify-between min-h-[540px] max-h-[90vh]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/Logo_Sosmed_DDV_91a73047.jpg"
              alt="Logo DDVolunteer"
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover bg-white border border-black/10 shrink-0"
            />
            <span className="font-display text-base font-bold text-ink">
              DDV Banten
            </span>
          </div>
          <span className="text-xs font-medium text-ink/75">
            Transparansi Kas 2026
          </span>
        </div>

        <div className="my-auto py-6">
          <svg
            viewBox="0 0 300 200"
            className="w-full max-w-[300px] mx-auto"
            role="img"
            aria-label="Ilustrasi relawan dan dompet"
          >
            <circle cx="150" cy="95" r="80" fill="#a9d33f" />
            <rect
              x="70"
              y="95"
              width="160"
              height="85"
              rx="18"
              fill="#fff"
              stroke="#14160f"
              strokeWidth="3"
              strokeDasharray="7 5"
            />
            <circle
              cx="205"
              cy="125"
              r="14"
              fill="#C8F25A"
              stroke="#14160f"
              strokeWidth="3"
            />
            <circle
              cx="150"
              cy="55"
              r="22"
              fill="#fff"
              stroke="#14160f"
              strokeWidth="3"
            />
            <path
              d="M95 60l-20-25M150 77v25"
              stroke="#14160f"
              strokeWidth="3"
              fill="none"
            />
          </svg>

          <h1 className="mt-6 font-display text-4xl sm:text-[42px] font-bold leading-[1.08] tracking-tight text-ink text-balance">
            Kas relawan, terbuka untuk semua
          </h1>
          <p className="mt-3 text-base text-ink/85 leading-relaxed">
            Catat, pantau, dan reimburse kegiatan DDV Banten 2026 dengan mudah.
          </p>
          <img
            src="/assets/aistudio/web_ddv_hitam_09a366b7.png"
            alt="volunteer.dompetdhuafa.org"
            referrerPolicy="no-referrer"
            className="mt-4 h-3.5 w-auto object-contain opacity-80"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-[44px] px-3 text-sm font-semibold text-ink/80 hover:text-ink"
          >
            Lewati
          </button>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Mulai masuk ke Beranda"
            className="w-16 h-16 rounded-full bg-ink text-white grid place-items-center hover:bg-ink/90 active:scale-95 transition-transform"
          >
            <ArrowUpRight className="w-7 h-7" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
