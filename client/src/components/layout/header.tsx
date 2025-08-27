import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { authApi } from '@/lib/api';
import { useWebSocket } from '@/hooks/use-websocket';
import { LogOut, User, Settings } from 'lucide-react';

interface HeaderProps {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}

export default function Header({ user }: HeaderProps) {
  const queryClient = useQueryClient();
  const { isConnected, connectionState } = useWebSocket();

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4" data-testid="header">
      <div className="flex items-center justify-between">
        <div data-testid="header-title">
          <h2 className="text-xl font-semibold" data-testid="page-title">Multi-Agent Dashboard</h2>
          <p className="text-sm text-muted-foreground" data-testid="page-subtitle">
            Real-time fraud detection monitoring
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* WebSocket Status */}
          <div className="flex items-center space-x-2" data-testid="websocket-status">
            <div className={`w-2 h-2 rounded-full pulse-dot ${
              isConnected ? 'bg-success' : 'bg-destructive'
            }`} data-testid="websocket-indicator" />
            <span className="text-sm text-muted-foreground" data-testid="websocket-text">
              {isConnected ? 'Live Updates' : `Connection ${connectionState}`}
            </span>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 p-2" data-testid="user-menu-trigger">
                <Avatar className="h-8 w-8" data-testid="user-avatar">
                  <AvatarFallback data-testid="user-avatar-fallback">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <div className="text-sm font-medium" data-testid="user-name">{user.username}</div>
                  <div className="text-xs text-muted-foreground capitalize" data-testid="user-role">{user.role}</div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" data-testid="user-menu">
              <DropdownMenuItem data-testid="menu-profile">
                <User className="mr-2 h-4 w-4" />
                <div>
                  <div className="font-medium">{user.username}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-testid="menu-settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                data-testid="menu-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
