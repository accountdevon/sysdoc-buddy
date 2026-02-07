import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Shield } from 'lucide-react';

interface SessionWarningDialogProps {
  open: boolean;
  countdown: number;
  onStayLoggedIn: () => void;
}

export function SessionWarningDialog({ open, countdown, onStayLoggedIn }: SessionWarningDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive" />
            Session Expiring
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>You will be logged out due to inactivity.</p>
            <div className="flex items-center justify-center">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="absolute inset-0 w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32" cy="32" r="28"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="4"
                  />
                  <circle
                    cx="32" cy="32" r="28"
                    fill="none"
                    stroke="hsl(var(--destructive))"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - countdown / 10)}`}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <span className="text-2xl font-bold text-destructive">{countdown}</span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onStayLoggedIn} className="w-full">
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
