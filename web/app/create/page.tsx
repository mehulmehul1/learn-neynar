"use client";
import * as React from 'react';
import dynamic from 'next/dynamic';
import { Layout } from '../../components/Layout';

const ComposeForm = dynamic(() => import('../../components/compose-form').then(m => m.ComposeForm), { ssr: false });

export default function CreatePage() {
  return (
    <Layout>
      <h1 className="text-xl font-semibold mb-3">Create</h1>
      <ComposeForm />
    </Layout>
  );
}
