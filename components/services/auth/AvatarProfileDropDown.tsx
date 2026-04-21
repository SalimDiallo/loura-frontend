"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/lib/hooks/auth/useCurrentUser";
import { LogOut, Settings, User } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

export function AvatarProfileDropDown() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);

  const userInitials = React.useMemo(() => {
    if (!user) return "U";
    if (user.first_name && user.last_name)
      return `${user.first_name[0]}`.toUpperCase();
    return "U";
  }, [user]);

  const fullName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.email || "Utilisateur";

  const handleLogout = () => {
    localStorage.removeItem("loura_access_token");
    router.push("/auth");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span className="inline-flex cursor-pointer">
            <Avatar>
              {user?.avatar_url ? (
                <AvatarImage src={user.avatar_url} alt="avatar" />
              ) : (
                <AvatarFallback>{userInitials}</AvatarFallback>
              )}
            </Avatar>
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuLabel className="flex flex-col gap-1">
            <span className="font-semibold">{fullName}</span>
            <span className="text-muted-foreground text-[8px]">
              {user?.email}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => router.push("/core/profile")}
            className="flex items-center gap-2"
          >
            <User className="size-4 mr-2" />
            Mon profil
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push("/core/settings")}
            className="flex items-center gap-2"
          >
            <Settings className="size-4 mr-2" />
            Paramètres
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setLogoutDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <LogOut className="size-4 mr-2" />
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Confirmer la déconnexion</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir vous déconnecter&nbsp;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              autoFocus
            >
              Se déconnecter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AvatarProfileDropDown;