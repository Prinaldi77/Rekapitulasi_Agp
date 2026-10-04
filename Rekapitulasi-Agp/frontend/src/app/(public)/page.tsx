'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Hero from '@/sections/home/Hero';
import QuickNav from '@/sections/home/QuickNav';

export default function PublicLandingPage() {
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    const fetchPublishStatus = async () => {
      try {
        const { data } = await supabase
          .from('categories')
          .select('is_published')
          .eq('level', 'SMA')
          .limit(1)
          .maybeSingle();

        if (data) {
          setIsPublished(data.is_published);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchPublishStatus();
  }, []);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12 space-y-12">
      {/* Banner / Hero */}
      <Hero isPublished={isPublished} />

      {/* Quick Navigation Cards */}
      <QuickNav />

      {/* Cloud Server Notice Footer */}
      <div className="text-center pt-8 border-t border-gray-200 max-w-xl mx-auto">
        <p className="text-[11px] text-gray-500 font-medium tracking-wide">
          ⚡ Serverless High Availability &bull; Tersambung Cloud Gateway AGP 2026
        </p>
      </div>
    </main>
  );
}
