import { Terminal, Sun, Moon, LogIn, LogOut, Download, Upload, Shield, Settings, Key, FileKey, Search, MoreVertical, CloudDownload, CloudUpload, Loader2, HardDrive, RotateCcw } from 'lucide-react';
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

interface HeaderProps {
  mobileNav?: React.ReactNode;
  onOpenSearch?: () => void;
}

export function Header({ mobileNav, onOpenSearch }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin, login, loginWithFile, logout, changePassword, generateResetKey, generateAuthFile, resetPasswordWithKey } = useAuth();
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
  const [resetKeyPwd, setResetKeyPwd] = useState('');
  const [authFilePwd, setAuthFilePwd] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [isGeneratingAuthFile, setIsGeneratingAuthFile] = useState(false);
  // Reset password state
  const [resetNewPwd, setResetNewPwd] = useState('');
  const [resetConfirmPwd, setResetConfirmPwd] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authFileInputRef = useRef<HTMLInputElement>(null);
  const resetFileInputRef = useRef<HTMLInputElement>(null);
  const [resetFileContent, setResetFileContent] = useState<string | null>(null);
  const [resetFileName, setResetFileName] = useState('');

  const handleLogin = async () => {
    const success = await login(password);
    if (success) {
      setLoginOpen(false);
      setPassword('');
      toast.success('Admin access granted');
    } else {
      toast.error('Invalid password');
    }
  };

  const handleFileLogin = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        const success = await loginWithFile(content);
        if (success) {
          setLoginOpen(false);
          toast.success('Admin access granted via auth file');
        } else {
          toast.error('Invalid or expired auth file');
        }
      };
      reader.readAsText(file);
    }
    if (authFileInputRef.current) authFileInputRef.current.value = '';
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadToDrive = async () => {
    if (!driveScriptUrl) {
      setDriveSettingsOpen(true);
      toast.error('Please configure your Google Apps Script URL first');
      return;
    }
    const success = await uploadToDrive();
    if (success) toast.success('Data uploaded to Google Drive');
    else toast.error('Failed to upload data to Google Drive');
  };

  const handleDownloadFromDrive = async () => {
    if (!driveScriptUrl) {
      setDriveSettingsOpen(true);
      toast.error('Please configure your Google Apps Script URL first');
      return;
    }
    const success = await downloadFromDrive();
    if (success) toast.success('Data downloaded from Google Drive');
    else toast.error('Failed to download data from Google Drive');
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

  const handleChangePassword = async () => {
    if (newPwd !== confirmPwd) { toast.error('Passwords do not match'); return; }
    if (newPwd.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    const success = await changePassword(currentPwd, newPwd);
    if (success) {
      toast.success('Password changed successfully');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } else {
      toast.error('Current password is incorrect');
    }
  };

  const handleGenerateResetKey = async () => {
    if (!resetKeyPwd) { toast.error('Please enter your current password'); return; }
    setIsGeneratingKey(true);
    try {
      const key = await generateResetKey(resetKeyPwd);
      if (key) {
        const blob = new Blob([key], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin-reset-key-${new Date().toISOString().split('T')[0]}.key`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Reset key file downloaded. Keep it safe!');
        setResetKeyPwd('');
      } else {
        toast.error('Invalid password. Cannot generate reset key.');
      }
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleGenerateAuthFile = async () => {
    if (!authFilePwd) { toast.error('Please enter your current password'); return; }
    setIsGeneratingAuthFile(true);
    try {
      const key = await generateAuthFile(authFilePwd);
      if (key) {
        const blob = new Blob([key], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin-auth-${new Date().toISOString().split('T')[0]}.key`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Auth file downloaded. Use it to login on other devices.');
        setAuthFilePwd('');
      } else {
        toast.error('Invalid password. Cannot generate auth file.');
      }
    } finally {
      setIsGeneratingAuthFile(false);
    }
  };

  const handleResetFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResetFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        setResetFileContent(e.target?.result as string);
      };
      reader.readAsText(file);
    }
    if (resetFileInputRef.current) resetFileInputRef.current.value = '';
  };

  const handleResetPassword = async () => {
    if (!resetFileContent) { toast.error('Please upload a reset key file'); return; }
    if (resetNewPwd !== resetConfirmPwd) { toast.error('Passwords do not match'); return; }
    if (resetNewPwd.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setIsResetting(true);
    try {
      const success = await resetPasswordWithKey(resetFileContent, resetNewPwd);
      if (success) {
        toast.success('Password reset successfully! You are now logged in.');
        setLoginOpen(false);
        setResetFileContent(null);
        setResetFileName('');
        setResetNewPwd('');
        setResetConfirmPwd('');
      } else {
        toast.error('Invalid or expired reset key file');
      }
    } finally {
      setIsResetting(false);
    }
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

          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <input ref={resetFileInputRef} type="file" accept=".key" onChange={handleResetFileSelect} className="hidden" />

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
                {/* Settings - always available */}
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                {isAdmin ? (
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setLoginOpen(true)}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Admin login
                  </DropdownMenuItem>
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" disabled={isSyncing}>
                    {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover z-50">
                  {isAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                        <Key className="h-4 w-4 mr-2" />
                        Admin Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
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

          {/* Admin Settings Dialog */}
          {isAdmin && (
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Admin Settings
                  </DialogTitle>
                  <DialogDescription>
                    Manage your admin password and recovery key
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="password" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="password">Password</TabsTrigger>
                    <TabsTrigger value="authfile">Auth File</TabsTrigger>
                    <TabsTrigger value="resetkey">Reset Key</TabsTrigger>
                  </TabsList>
                  <TabsContent value="password" className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="current">Current Password</Label>
                      <Input id="current" type="password" placeholder="Enter current password" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new">New Password</Label>
                      <Input id="new" type="password" placeholder="Enter new password (min 6 chars)" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm">Confirm Password</Label>
                      <Input id="confirm" type="password" placeholder="Confirm new password" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
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
                        Generate Auth Login File
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Generate an encrypted auth file to login from another device without typing your password. Keep this file secure!
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="authfile-pwd">Current Password</Label>
                        <Input id="authfile-pwd" type="password" placeholder="Enter current password" value={authFilePwd} onChange={(e) => setAuthFilePwd(e.target.value)} />
                      </div>
                      <Button onClick={handleGenerateAuthFile} className="w-full gap-2" disabled={isGeneratingAuthFile}>
                        <Download className="h-4 w-4" />
                        {isGeneratingAuthFile ? 'Generating...' : 'Generate & Download Auth File'}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                      <p className="font-medium mb-1">ℹ️ Note:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>The auth file becomes invalid after you change your password</li>
                        <li>Use it in the "Auth File" tab on the login dialog</li>
                        <li>Store the .key file securely</li>
                      </ul>
                    </div>
                  </TabsContent>
                  <TabsContent value="resetkey" className="space-y-4 py-4">
                    <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileKey className="h-4 w-4 text-primary" />
                        Generate Password Reset Key
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Generate an encrypted key file that can be used to reset your password if you forget it. Keep this file in a safe place!
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="resetkey-pwd">Current Password</Label>
                        <Input id="resetkey-pwd" type="password" placeholder="Enter current password" value={resetKeyPwd} onChange={(e) => setResetKeyPwd(e.target.value)} />
                      </div>
                      <Button onClick={handleGenerateResetKey} className="w-full gap-2" disabled={isGeneratingKey}>
                        <Download className="h-4 w-4" />
                        {isGeneratingKey ? 'Generating...' : 'Generate & Download Reset Key'}
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
                      <p className="font-medium mb-1">⚠️ Important:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>The reset key becomes invalid after you change your password</li>
                        <li>Generate a new key after each password change</li>
                        <li>Store the .key file securely offline</li>
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
              </DialogContent>
            </Dialog>
          )}

          {/* Non-admin settings (Drive, import/export) */}
          {!isAdmin && isMobile && (
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Settings
                  </DialogTitle>
                  <DialogDescription>
                    Data sync and import/export settings
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-4">
                  <Button onClick={handleDownloadFromDrive} disabled={isSyncing} className="w-full gap-2" variant="outline">
                    <CloudDownload className="h-4 w-4" />
                    Download from Drive
                  </Button>
                  <Button onClick={() => { setSettingsOpen(false); setDriveSettingsOpen(true); }} className="w-full gap-2" variant="outline">
                    <HardDrive className="h-4 w-4" />
                    Drive Settings
                  </Button>
                  <DropdownMenuSeparator />
                  <Button onClick={handleExport} className="w-full gap-2" variant="outline">
                    <Download className="h-4 w-4" />
                    Export JSON
                  </Button>
                  <Button onClick={() => fileInputRef.current?.click()} className="w-full gap-2" variant="outline">
                    <Upload className="h-4 w-4" />
                    Import JSON
                  </Button>
                </div>
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
                    Enter your password, use an auth file, or reset your password
                  </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="password" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="password">Password</TabsTrigger>
                    <TabsTrigger value="file">Auth File</TabsTrigger>
                    <TabsTrigger value="reset">Reset</TabsTrigger>
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
                    <Button onClick={handleLogin} className="w-full">Login</Button>
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
                      <input ref={authFileInputRef} type="file" accept=".key" onChange={handleFileLogin} className="hidden" />
                      <Button onClick={() => authFileInputRef.current?.click()} className="w-full gap-2" variant="outline">
                        <Upload className="h-4 w-4" />
                        Upload Auth File
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="reset" className="space-y-4 py-4">
                    <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <RotateCcw className="h-4 w-4 text-primary" />
                        Reset Password with Key File
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Upload your reset key file and set a new password.
                      </p>
                      <Button onClick={() => resetFileInputRef.current?.click()} className="w-full gap-2" variant="outline">
                        <Upload className="h-4 w-4" />
                        {resetFileName ? resetFileName : 'Upload Reset Key File'}
                      </Button>
                      {resetFileContent && (
                        <>
                          <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input type="password" placeholder="Enter new password (min 6 chars)" value={resetNewPwd} onChange={(e) => setResetNewPwd(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                            <Label>Confirm Password</Label>
                            <Input type="password" placeholder="Confirm new password" value={resetConfirmPwd} onChange={(e) => setResetConfirmPwd(e.target.value)} />
                          </div>
                          <Button onClick={handleResetPassword} className="w-full gap-2" disabled={isResetting}>
                            <RotateCcw className="h-4 w-4" />
                            {isResetting ? 'Resetting...' : 'Reset Password'}
                          </Button>
                        </>
                      )}
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
                  <Input id="scriptUrl" type="url" placeholder="https://script.google.com/macros/s/..." value={scriptUrlInput} onChange={(e) => setScriptUrlInput(e.target.value)} />
                </div>
                {driveScriptUrl && (
                  <div className="text-xs text-muted-foreground">
                    Current URL: {driveScriptUrl.substring(0, 50)}...
                  </div>
                )}
                <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    To use Google Drive sync, you need to create a Google Apps Script web app.
                  </p>
                </div>
                <Button onClick={handleSaveDriveScriptUrl} className="w-full">Save URL</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
