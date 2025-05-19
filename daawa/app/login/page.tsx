'use client';

import React from 'react';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 bg-base-200">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
} 