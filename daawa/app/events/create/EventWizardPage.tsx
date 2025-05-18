'use client';

import { useTranslation } from 'next-i18next';
import dynamic from 'next/dynamic';

const EventWizard = dynamic(() => import('@/components/EventWizard'), { ssr: false });

export default function EventWizardPage() {
  const { t } = useTranslation('event');

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-base-100 py-8 px-2">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-2 text-center">
          {t('event.create.title')}
        </h1>
        <p className="text-base-content/70 mb-8 text-center">
          {t('event.create.description')}
        </p>
        <EventWizard />
      </div>
    </main>
  );
}
