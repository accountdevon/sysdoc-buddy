import { Terminal, Sun, Moon, LogIn, LogOut, Download, Upload, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, login, logout } = useAuth();
  const { exportData, importData } = useData();
  const [password, setPassword] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = () => {
    if (login(password)) {
      setLoginOpen(false);
      setPassword('');
      toast.success('Admin access granted');
    } else {
      toast.error('Invalid password');
    }
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linux-admin-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (importData(content)) {
          toast.success('Data imported successfully');
        } else {
          toast.error('Invalid data format');
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 terminal-border">
            <Terminal className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Linux Admin</h1>
            <p className="text-xs text-muted-foreground">Command Reference</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <span className="admin-badge">
              <Shield className="h-3 w-3" />
              Admin
            </span>
          )}

          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button variant="ghost" size="icon" onClick={handleExport} className="h-9 w-9">
            <Download className="h-4 w-4" />
          </Button>

          {isAdmin && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-9 w-9"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </>
          )}

          {isAdmin ? (
            <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          ) : (
            <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Admin Login
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Admin Access
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Enter admin password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <p className="text-xs text-muted-foreground">
                      Default password: admin123
                    </p>
                  </div>
                  <Button onClick={handleLogin} className="w-full">
                    Login
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </header>
  );
}
