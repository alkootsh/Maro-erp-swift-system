import React from 'react';
import { Loader2, Save } from 'lucide-react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText = 'جاري الحفظ...',
  icon = <Save size={16} />,
  children,
  variant = 'primary',
  disabled,
  className = '',
  type = 'submit',
  ...props
}) => {
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300'
  };

  return (
    <button
      type={type}
      disabled={loading || disabled}
      {...props}
      className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin text-white shrink-0" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};
