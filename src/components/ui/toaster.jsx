import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import React from 'react';

const VARIANT_CONFIG = {
  success: {
    icon:       CheckCircle2,
    accent:     '#22c55e',
    iconBg:     'rgba(34,197,94,0.12)',
    iconColor:  '#22c55e',
  },
  destructive: {
    icon:       XCircle,
    accent:     '#ef4444',
    iconBg:     'rgba(239,68,68,0.12)',
    iconColor:  '#ef4444',
  },
  warning: {
    icon:       AlertTriangle,
    accent:     '#f59e0b',
    iconBg:     'rgba(245,158,11,0.12)',
    iconColor:  '#f59e0b',
  },
  default: {
    icon:       Info,
    accent:     '#FF6B35',
    iconBg:     'rgba(255,107,53,0.12)',
    iconColor:  '#FF6B35',
  },
};

export function Toaster() {
  const { toasts } = useToast();
  const { isDark } = useTheme();

  const bg     = isDark ? '#18181b' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';
  const titleColor = isDark ? '#ffffff' : '#0f0f0f';
  const descColor  = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
  const closeBg    = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const closeColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';
  const closeHover = isDark ? '#ffffff' : '#0f0f0f';

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        const cfg = VARIANT_CONFIG[variant] || VARIANT_CONFIG.default;
        const Icon = cfg.icon;

        return (
          <Toast
            key={id}
            variant={variant}
            style={{
              background:   bg,
              border:       `1px solid ${border}`,
              borderLeft:   `3px solid ${cfg.accent}`,
            }}
            {...props}
          >
            {/* Icon */}
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '0.5rem',
                background: cfg.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginRight: '0.75rem',
              }}
            >
              <Icon size={16} style={{ color: cfg.iconColor }} />
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0, marginRight: '1.5rem' }}>
              {title && (
                <ToastTitle
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: titleColor,
                    lineHeight: 1.3,
                    marginBottom: description ? '0.2rem' : 0,
                  }}
                >
                  {title}
                </ToastTitle>
              )}
              {description && (
                <ToastDescription
                  style={{
                    fontSize: '0.75rem',
                    color: descColor,
                    lineHeight: 1.5,
                  }}
                >
                  {description}
                </ToastDescription>
              )}
              {action}
            </div>

            {/* Close button */}
            <ToastClose
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                width: '1.5rem',
                height: '1.5rem',
                borderRadius: '0.375rem',
                background: closeBg,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: closeColor,
                transition: 'color 150ms, background 150ms',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = closeHover;
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = closeColor;
                e.currentTarget.style.background = closeBg;
              }}
            >
              <X size={12} />
            </ToastClose>
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}