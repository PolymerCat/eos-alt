import React from 'react';
import { PPS } from '@/app/actions';

interface MapSidebarProps {
  ppsData: PPS[];
  isOpen: boolean;
}

export default function MapSidebar({ ppsData, isOpen }: MapSidebarProps) {
  return (
    <div className={`absolute top-16 left-0 z-10 h-[calc(100vh-4rem)] bg-white shadow-lg transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} w-80`}>
      <div className="p-4 border-b">
        <h2 className="text-lg font-bold">Open PPS Centers</h2>
        <p className="text-sm text-gray-600">{ppsData.length} centers found</p>
      </div>
      <div className="overflow-y-auto h-full pb-20">
        {ppsData.map((pps) => (
          <div key={pps.id} className="p-4 border-b hover:bg-gray-50 cursor-pointer">
            <h3 className="font-semibold">{pps.name}</h3>
            <p className="text-sm text-gray-600">{pps.daerah}, {pps.negeri}</p>
            <p className="text-xs text-red-600">{pps.bencana}</p>
            <p className="text-xs">Capacity: {pps.kapasiti}</p>
          </div>
        ))}
      </div>
    </div>
  );
}