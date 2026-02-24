import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// Désactive complètement la mise en cache
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getProfiles() {
  const profiles = await prisma.userProfile.findMany({
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      userSubscription: {
        include: {
          subscription: {
            include: {
              offer: true,
              platformOffer: {
                include: {
                  platform: true,
                },
              },
            },
          },
        },
      },
      avatarMedia: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return profiles;
}

export default async function ProfilesPage() {
  const profiles = await getProfiles();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Liste des Profils</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <div 
            key={profile.id} 
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile.avatarMedia?.path} alt={profile.name} />
                <AvatarFallback>
                  {profile.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 className="font-semibold text-lg">{profile.name}</h3>
                <p className="text-sm text-gray-500">
                  {profile.user.firstName} {profile.user.lastName}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm">
                <span className="font-medium">Plateforme:</span>{" "}
                {profile.userSubscription?.subscription?.platformOffer?.platform?.name || "N/A"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Offre:</span>{" "}
                {profile.userSubscription?.subscription?.offer?.name || "N/A"}
              </p>
              <p className="text-sm">
                <span className="font-medium">Email:</span>{" "}
                {profile.user.email}
              </p>
              <p className="text-sm text-gray-500">
                Créé {formatDistanceToNow(new Date(profile.createdAt), { 
                  addSuffix: true,
                  locale: fr 
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 
 
 
 
 