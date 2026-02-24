import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AccountDetails } from './account-details'

interface PageProps {
  params: {
  id: string
  }
}

async function getAccount(id: string) {
  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      platform: {
        select: {
          id: true,
          name: true,
          logo: true,
          type: true,
          hasProfiles: true,
          maxProfilesPerAccount: true,
          websiteUrl: true,
        },
      },
      accountProfiles: {
        include: {
          subscription: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          profileSlot: 'asc',
        },
      },
    },
      })
      
  if (!account) notFound()
  return account
}

export default async function AccountPage({ params }: PageProps) {
  const account = await getAccount(params.id)

  return (
    <div className="container mx-auto py-10">
      <AccountDetails id={params.id} initialData={account} />
    </div>
  )
} 