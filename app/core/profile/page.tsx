"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/lib/hooks/auth/useCurrentUser";
import {
  CheckCircle2,
  XCircle,
  MapPin,
  Phone,
  Globe,
  Calendar,
  User,
  Mail,
  Clock
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const [isUiLoading, setIsUiLoading] = useState(true);

  // Hook d'authentification utilisateur
  const { data: user, isLoading: isUserLoading, isError } = useCurrentUser();

  // Simule un chargement de la page (squelette UI, non lié au chargement de l'utilisateur)
  useEffect(() => {
    setIsUiLoading(true);
    const to = setTimeout(() => setIsUiLoading(false), 500);
    return () => clearTimeout(to);
  }, []);

  const isLoading = isUiLoading || isUserLoading;

  // En cas d'erreur de récupération des infos utilisateur
  if (isError) {
    return (
      <div className="px-4 py-6 max-w-3xl mx-auto">
        <div className="text-red-700 bg-red-100 px-4 py-3 rounded">
          Erreur lors du chargement de vos informations. Veuillez réessayer ou vous reconnecter.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6 max-w-3xl mx-auto space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid gap-6">
          <Card className="p-6 space-y-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-60" />
            <div className="flex gap-4">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Construction du nom à afficher
  const userName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.email || "Mon profil";

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-8">
      {/* En-tête avec avatar */}
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={userName}
              className="w-20 h-20 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-10 w-10 text-primary" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-foreground">
            {userName}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              user?.email_verified
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
              {user?.email_verified ? (
                <><CheckCircle2 className="h-3 w-3" /> Email vérifié</>
              ) : (
                <><XCircle className="h-3 w-3" /> Email non vérifié</>
              )}
            </span>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
              user?.is_active
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {user?.is_active ? 'Actif' : 'Inactif'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Informations personnelles */}
        <Card className="p-6 space-y-4">
          <div className="font-semibold text-base text-foreground tracking-tight">
            Informations personnelles
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> Prénom
              </div>
              <div className="text-sm font-medium mt-1">
                {user?.first_name || <span className="italic text-muted-foreground">Non renseigné</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> Nom
              </div>
              <div className="text-sm font-medium mt-1">
                {user?.last_name || <span className="italic text-muted-foreground">Non renseigné</span>}
              </div>
            </div>
            {user?.phone && (
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Téléphone
                </div>
                <div className="text-sm font-medium mt-1">{user.phone}</div>
              </div>
            )}
            {user?.date_of_birth && (
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Date de naissance
                </div>
                <div className="text-sm font-medium mt-1">{formatDate(user.date_of_birth)}</div>
              </div>
            )}
          </div>
        </Card>

        {/* Adresse */}
        {(user?.address || user?.city || user?.country) && (
          <Card className="p-6 space-y-4">
            <div className="font-semibold text-base text-foreground tracking-tight flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Adresse
            </div>
            <div className="space-y-2">
              {user?.address && (
                <div className="text-sm">{user.address}</div>
              )}
              <div className="flex gap-2 text-sm">
                {user?.city && <span className="font-medium">{user.city}</span>}
                {user?.city && user?.country && <span>•</span>}
                {user?.country && <span>{user.country}</span>}
              </div>
            </div>
          </Card>
        )}

        {/* Préférences */}
        <Card className="p-6 space-y-4">
          <div className="font-semibold text-base text-foreground tracking-tight flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Préférences
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Langue</div>
              <div className="text-sm font-medium mt-1">
                {user?.language || <span className="italic text-muted-foreground">Non renseigné</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Fuseau horaire
              </div>
              <div className="text-sm font-medium mt-1">
                {user?.timezone || <span className="italic text-muted-foreground">Non renseigné</span>}
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="pt-4 flex flex-col gap-2 md:flex-row md:gap-4">
          <Button
            size="default"
            className="w-full md:w-auto"
            onClick={() => router.push("/core/profile/edit")}
          >
            Modifier mon profil
          </Button>
          <Button
            size="default"
            variant="outline"
            className="w-full md:w-auto"
            onClick={() => router.push("/core/change-password")}
          >
            Modifier mon mot de passe
          </Button>
        </div>
      </div>

      {/* Métadonnées */}
      {(user?.created_at || user?.updated_at) && (
        <Card className="p-4 bg-muted/50">
          <div className="text-xs text-muted-foreground space-y-1">
            {user?.created_at && (
              <div>Compte créé le {formatDate(user.created_at)}</div>
            )}
            {user?.updated_at && (
              <div>Dernière mise à jour le {formatDate(user.updated_at)}</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}