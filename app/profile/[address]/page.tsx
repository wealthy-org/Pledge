import React from 'react';
import { ProfileDetailClient } from './ProfileDetailClient';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  return <ProfileDetailClient address={address} />;
}
