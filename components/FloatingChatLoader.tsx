'use client';

import dynamic from 'next/dynamic';

const FloatingChat = dynamic(() => import('@/components/FloatingChat'), {
  ssr: false,
});

export default function FloatingChatLoader() {
  return <FloatingChat />;
}
