"use client";

import { DetailPageLayout } from "@/components/layout/DetailPageLayout";
import { Card } from "@/components/ui/card";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { InfoField } from "@/components/ui/info-field";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/lib/hooks/auth/useCurrentUser";
import {
    Calendar,
    CheckCircle2,
    Clock,
    Globe,
    Mail,
    MapPin,
    Phone,
    User,
    XCircle
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
            </Card>
          </div>
        </div>
    );
  }

  // Construction du nom à afficher
  const fullName = user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : "Mon profil";

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <DetailPageLayout
      title={fullName}
      subtitle={user?.email}
      avatar={<EntityAvatar src={user?.avatar_url} fallback={fullName} size="xl" />}
      badge={
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            user?.email_verified
              ? 'bg-green-100 text-green-700'
              : 'bg-orange-100 text-orange-700'
          }`}>
            {user?.email_verified ? (
              <><CheckCircle2 className="h-3 w-3" /> Vérifié</>
            ) : (
              <><XCircle className="h-3 w-3" /> Non vérifié</>
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
      }
      actions={[
        {
          label: "Modifier mon profil",
          onClick: () => router.push("/core/profile/edit"),
        },
        {
          label: "Modifier mon mot de passe",
          onClick: () => router.push("/core/change-password"),
          variant: "outline",
        }
      ]}
    >
      <div className="grid gap-6">
        {/* Informations personnelles */}
        <Card className="p-6 space-y-4">
          <div className="font-semibold text-base text-foreground tracking-tight">
            Informations personnelles
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label="Prénom" value={user?.first_name} icon={User} />
            <InfoField label="Nom" value={user?.last_name} icon={User} />
            <InfoField label="Email" value={user?.email} icon={Mail} />
            <InfoField label="Téléphone" value={user?.phone} icon={Phone} />
            <InfoField label="Date de naissance" value={formatDate(user?.date_of_birth)} icon={Calendar} />
          </div>
        </Card>

        {/* Adresse */}
        {(user?.address || user?.city || user?.country) && (
          <Card className="p-6 space-y-4">
            <div className="font-semibold text-base text-foreground tracking-tight flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Adresse
            </div>
            <div className="space-y-4">
              {user?.address && <InfoField label="Rue" value={user.address} />}
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Ville" value={user?.city} />
                <InfoField label="Pays" value={user?.country} />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label="Langue" value={user?.language} />
            <InfoField label="Fuseau horaire" value={user?.timezone} icon={Clock} />
          </div>
        </Card>

        {/* Métadonnées */}
        {(user?.created_at || user?.updated_at) && (
          <div className="text-xs text-muted-foreground space-y-1 px-2">
            {user?.created_at && (
              <div>Compte créé le {formatDate(user.created_at)}</div>
            )}
            {user?.updated_at && (
              <div>Dernière mise à jour le {formatDate(user.updated_at)}</div>
            )}
          </div>
        )}
      </div>
    </DetailPageLayout>
  );
}