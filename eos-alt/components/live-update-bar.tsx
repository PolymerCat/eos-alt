"use client";

import React from "react";
import { WeatherWarning } from "@/app/actions";

export default function LiveUpdateBar({ warnings }: { warnings: WeatherWarning[] }) {
  if (!warnings || warnings.length === 0) return null;

  const renderItems = () => (
    warnings.map((w, i) => (
      <span key={i} className="mx-6 inline-flex items-center">
        <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-3 animate-pulse"></span>
        <span className="font-bold mr-2">{w.warning_issue?.title_bm || w.heading_bm}:</span>
        <span>{w.text_bm}</span>
      </span>
    ))
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#FFD700] text-black font-medium text-sm sm:text-base py-2 flex items-center shadow-[0_-4px_10px_rgba(0,0,0,0.15)] border-t-[3px] border-red-600 overflow-hidden">

      <div className="bg-red-600 text-white px-4 py-3 font-bold z-10 flex items-center absolute left-0 h-full uppercase tracking-wider drop-shadow-md">
        <span className="animate-pulse mr-2 w-2.5 h-2.5 bg-white rounded-full flex-shrink-0"></span>
        <span className="hidden sm:inline whitespace-nowrap">Amaran Cuaca</span>
        <span className="sm:hidden">Amaran</span>
      </div>

      <div className="flex-1 overflow-hidden whitespace-nowrap pl-[100px] sm:pl-[200px]">
        {/* We use double rendering for seamless looping */}
        <div className="flex w-max animate-marquee hover:pause">
          <div className="flex items-center justify-around min-w-[100vw]">
            {renderItems()}
          </div>
          <div className="flex items-center justify-around min-w-[100vw]">
            {renderItems()}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 90s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
}
