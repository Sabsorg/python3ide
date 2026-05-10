type Variant = 'active' | 'paused' | 'archived' | 'high' | 'medium' | 'low' | 'content' | 'targeting' | 'links' | 'timing';

const styles: Record<Variant, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  archived: 'bg-slate-100 text-slate-500',
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
  content: 'bg-purple-100 text-purple-700',
  targeting: 'bg-blue-100 text-blue-700',
  links: 'bg-indigo-100 text-indigo-700',
  timing: 'bg-teal-100 text-teal-700',
};

export default function Badge({ variant, label }: { variant: Variant; label?: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${styles[variant]}`}
    >
      {label ?? variant}
    </span>
  );
}
