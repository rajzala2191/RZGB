import * as ToastPrimitives from '@radix-ui/react-toast';
import React from 'react';

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={className}
    style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      width: '22rem',
      maxWidth: 'calc(100vw - 2rem)',
      outline: 'none',
    }}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const Toast = React.forwardRef(({ className, style, ...props }, ref) => (
  <ToastPrimitives.Root
    ref={ref}
    className={className}
    style={{
      pointerEvents: 'auto',
      position: 'relative',
      display: 'flex',
      width: '100%',
      alignItems: 'flex-start',
      overflow: 'hidden',
      borderRadius: '0.75rem',
      padding: '1rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.2)',
      transition: 'all 150ms ease',
      ...style,
    }}
    {...props}
  />
));
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef((props, ref) => (
  <ToastPrimitives.Action ref={ref} {...props} />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef(({ style, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    toast-close=""
    style={{ outline: 'none', ...style }}
    {...props}
  />
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef((props, ref) => (
  <ToastPrimitives.Title ref={ref} {...props} />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef((props, ref) => (
  <ToastPrimitives.Description ref={ref} {...props} />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
};