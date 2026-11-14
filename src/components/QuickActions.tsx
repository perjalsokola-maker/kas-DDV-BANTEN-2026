import { ArrowLeftRight, LayoutGrid, MoreHorizontal, Plus } from 'lucide-react';

interface QuickActionsProps {
  onAddTransaction: () => void;
  onOpenReimburse: () => void;
  onOpenKegiatan: () => void;
  onOpenMore: () => void;
  pendingCount: number;
}

export function QuickActions({
  onAddTransaction,
  onOpenReimburse,
  onOpenKegiatan,
  onOpenMore,
  pendingCount,
}: QuickActionsProps) {
  const actions = [
    {
      label: 'Catat',
      icon: Plus,
      onClick: onAddTransaction,
      highlight: false,
      badge: null as number | null,
    },
    {
      label: 'Reimburse',
      icon: ArrowLeftRight,
      onClick: onOpenReimburse,
      highlight: false,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      label: 'Kegiatan',
      icon: LayoutGrid,
      onClick: onOpenKegiatan,
      highlight: false,
      badge: null,
    },
    {
      label: 'Lainnya',
      icon: MoreHorizontal,
      onClick: onOpenMore,
      highlight: true,
      badge: null,
    },
  ];

  return (
    <div
      className="grid grid-cols-4 gap-2 sm:gap-3"
      role="group"
      aria-label="Aksi cepat kas"
    >
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="group flex flex-col items-center justify-center gap-1.5 py-1 min-h-[44px] rounded-2xl focus-visible:outline-2 focus-visible:outline-ink focus-visible:outline-offset-2"
          >
            <span
              className={`relative grid place-items-center w-14 h-14 sm:w-16 sm:h-16 rounded-full transition-transform duration-150 group-active:scale-95 ${
                action.highlight
                  ? 'bg-lime-accent text-ink group-hover:bg-lime-deep'
                  : 'bg-white text-ink border border-black/5 group-hover:bg-lime-accent/60'
              }`}
            >
              <Icon className="w-6 h-6" strokeWidth={2.2} aria-hidden="true" />
              {action.badge !== null && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-expense text-white text-[11px] font-bold grid place-items-center tabular-nums">
                  {action.badge}
                </span>
              )}
            </span>
            <span className="text-xs sm:text-[13px] font-medium text-ink whitespace-nowrap">
              {action.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
