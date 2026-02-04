import { Terminal, Sun, Moon, LogIn, LogOut, Download, Upload, Shield, Settings, Key, FileKey, RotateCcw, Search, MoreVertical, CloudDownload, CloudUpload, Loader2, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useState, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface HeaderProps {
  mobileNav?: React.ReactNode;
  onOpenSearch?: () => void;
}

export function Header({ mobileNav, onOpenSearch }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, login, loginWithFile, logout, changePassword, resetToDefault, generateAuthFile, isDefaultPassword } = useAuth();
  const { exportData, importData, uploadToDrive, downloadFromDrive, setDriveScriptUrl, driveScriptUrl, isSyncing, lastSyncedAt } = useData();
  const isMobile = useIsMobile();
  const [password, setPassword] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [driveSettingsOpen, setDriveSettingsOpen] = useState(false);
  const [scriptUrlInput, setScriptUrlInput] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authFileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = () => {
    if (login(password)) {
      setLoginOpen(false);
      setPassword('');
      toast.success('Admin access granted');
    } else {
      toast.error('Invalid password');
    }
  };

  const handleFileLogin = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (loginWithFile(content)) {
          setLoginOpen(false);
          toast.success('Admin access granted via auth file');
        } else {
          toast.error('Invalid or expired auth file');
        }
      };
      reader.readAsText(file);
    }
    if (authFileInputRef.current) {
      authFileInputRef.current.value = '';
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

  const handleUploadToDrive = async () => {
    if (!driveScriptUrl) {
      setDriveSettingsOpen(true);
      toast.error('Please configure your Google Apps Script URL first');
      return;
    }
    const success = await uploadToDrive();
    if (success) {
      toast.success('Data uploaded to Google Drive');
    } else {
      toast.error('Failed to upload data to Google Drive');
    }
  };

  const handleDownloadFromDrive = async () => {
    if (!driveScriptUrl) {
      setDriveSettingsOpen(true);
      toast.error('Please configure your Google Apps Script URL first');
      return;
    }
    const success = await downloadFromDrive();
    if (success) {
      toast.success('Data downloaded from Google Drive');
    } else {
      toast.error('Failed to download data from Google Drive');
    }
  };

  const handleSaveDriveScriptUrl = () => {
    if (scriptUrlInput.trim()) {
      setDriveScriptUrl(scriptUrlInput.trim());
      setDriveSettingsOpen(false);
      toast.success('Google Apps Script URL saved');
    } else {
      toast.error('Please enter a valid URL');
    }
  };

  const handleChangePassword = () => {
    if (newPwd !== confirmPwd) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPwd.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (changePassword(currentPwd, newPwd)) {
      toast.success('Password changed successfully');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } else {
      toast.error('Current password is incorrect');
    }
  };

  const handleGenerateAuthFile = () => {
    const authData = generateAuthFile();
    const blob = new Blob([authData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linux-admin-auth-${new Date().toISOString().split('T')[0]}.key`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Auth file generated - keep this file secure!');
  };

  const handleResetToDefault = () => {
    resetToDefault();
    setSettingsOpen(false);
    toast.success('Password reset to default. Please login again.');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 sm:h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 sm:gap-3">
          {mobileNav}
          <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 terminal-border">
            <Terminal className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold tracking-tight">Linux Admin</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Command Reference</p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {isAdmin && (
            <span className="admin-badge hidden sm:inline-flex">
              <Shield className="h-3 w-3" />
              Admin
            </span>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />

          {isMobile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover z-50">
                <DropdownMenuItem onClick={() => onOpenSearch?.()}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </DropdownMenuItem>
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  Toggle theme
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAdmin ? (
                  <>
                    <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLoginOpen(true)}>
                      <LogIn className="h-4 w-4 mr-2" />
                      Admin login
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
        ) : (
          <>
            <Button variant="ghost" size="icon" onClick={onOpenSearch} className="h-8 w-8 sm:h-9 sm:w-9">
              <Search className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 sm:h-9 sm:w-9">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" disabled={isSyncing}>
                  {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover z-50">
                {/* Admin Settings */}
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                      <Key className="h-4 w-4 mr-2" />
                      Admin Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {/* Drive Sync Options */}
                {isAdmin && (
                  <DropdownMenuItem onClick={handleUploadToDrive} disabled={isSyncing}>
                    <CloudUpload className="h-4 w-4 mr-2" />
                    Upload to Drive
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleDownloadFromDrive} disabled={isSyncing}>
                  <CloudDownload className="h-4 w-4 mr-2" />
                  Download from Drive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDriveSettingsOpen(true)}>
                  <HardDrive className="h-4 w-4 mr-2" />
                  Drive Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* JSON Import/Export */}
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import JSON
                </DropdownMenuItem>
                {lastSyncedAt && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      Last synced: {new Date(lastSyncedAt).toLocaleString()}
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            </>
          )}

          {isAdmin && (
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Admin Settings
                  </DialogTitle>
                  <DialogDescription>
                    Manage your admin password and authentication
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="password" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="password">Password</TabsTrigger>
                    <TabsTrigger value="authfile">Auth File</TabsTrigger>
                    <TabsTrigger value="reset">Reset</TabsTrigger>
                  </TabsList>
                  <TabsContent value="password" className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="current">Current Password</Label>
                      <Input
                        id="current"
                        type="password"
                        placeholder="Enter current password"
                        value={currentPwd}
                        onChange={(e) => setCurrentPwd(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new">New Password</Label>
                      <Input
                        id="new"
                        type="password"
                        placeholder="Enter new password (min 6 chars)"
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirm Password</Label>
                      <Input
                        id="confirm"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleChangePassword} className="w-full gap-2">
                      <Key className="h-4 w-4" />
                      Change Password
                    </Button>
                  </TabsContent>
                  <TabsContent value="authfile" className="space-y-4 py-4">
                    <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileKey className="h-4 w-4 text-primary" />
                        Encrypted Auth File
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Generate an encrypted authentication file to login from another device without typing your password. Keep this file secure!
                      </p>
                      <Button onClick={handleGenerateAuthFile} className="w-full gap-2">
                        <Download className="h-4 w-4" />
                        Generate Auth File
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Note: If you change your password, you'll need to generate a new auth file.
                    </p>
                  </TabsContent>
                  <TabsContent value="reset" className="space-y-4 py-4">
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                        <RotateCcw className="h-4 w-4" />
                        Reset to Default Password
                      </div>
                      <p className="text-xs text-muted-foreground">
                        If you've forgotten your password or lost your auth file, you can reset to the default password. You will be logged out.
                      </p>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="w-full gap-2">
                            <RotateCcw className="h-4 w-4" />
                            Reset Password
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will reset your admin password to the default value and log you out. Any existing auth files will become invalid.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResetToDefault}>
                              Reset Password
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                    {isDefaultPassword && (
                      <p className="text-xs text-center text-destructive">
                        ⚠️ You're using the default password. Consider changing it for security.
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          )}

          {isAdmin ? (
            !isMobile && (
              <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )
          ) : (
            <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
              {!isMobile && (
                <DialogTrigger asChild>
                  <Button variant="default" size="sm" className="gap-2">
                    <LogIn className="h-4 w-4" />
                    Admin Login
                  </Button>
                </DialogTrigger>
              )}
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Admin Access
                  </DialogTitle>
                  <DialogDescription>
                    Enter your password or use an auth file to login
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="password" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="password">Password</TabsTrigger>
                    <TabsTrigger value="file">Auth File</TabsTrigger>
                  </TabsList>
                  <TabsContent value="password" className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="Enter admin password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      />
                    </div>
                    <Button onClick={handleLogin} className="w-full">
                      Login
                    </Button>
                  </TabsContent>
                  <TabsContent value="file" className="space-y-4 py-4">
                    <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileKey className="h-4 w-4 text-primary" />
                        Login with Auth File
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Upload the encrypted .key file generated from Admin Settings.
                      </p>
                      <input
                        ref={authFileInputRef}
                        type="file"
                        accept=".key"
                        onChange={handleFileLogin}
                        className="hidden"
                      />
                      <Button
                        onClick={() => authFileInputRef.current?.click()}
                        className="w-full gap-2"
                        variant="outline"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Auth File
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          )}

          {/* Google Drive Settings Dialog */}
          <Dialog open={driveSettingsOpen} onOpenChange={setDriveSettingsOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-primary" />
                  Google Drive Settings
                </DialogTitle>
                <DialogDescription>
                  Configure your Google Apps Script URL for cloud sync
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="scriptUrl">Google Apps Script Web App URL</Label>
                  <Input
                    id="scriptUrl"
                    type="url"
                    placeholder="https://script.google.com/macros/s/..."
                    value={scriptUrlInput}
                    onChange={(e) => setScriptUrlInput(e.target.value)}
                  />
                </div>
                {driveScriptUrl && (
                  <div className="text-xs text-muted-foreground">
                    Current URL: {driveScriptUrl.substring(0, 50)}...
                  </div>
                )}
                <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    To use Google Drive sync, you need to create a Google Apps Script web app. The script should handle POST requests for upload and GET requests for download.
                  </p>
                </div>
                <Button onClick={handleSaveDriveScriptUrl} className="w-full">
                  Save URL
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
