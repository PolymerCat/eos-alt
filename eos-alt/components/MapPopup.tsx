import React from 'react';
import { PPS } from '@/app/actions';

interface MapPopupProps {
  pps: PPS;
}

export default function MapPopup({ pps }: MapPopupProps) {
  return (
    <div className="text-sm">
      <h3 className="font-bold">{pps.name}</h3>
      <p>{pps.daerah}, {pps.negeri}</p>
      <p>Bencana: {pps.bencana}</p>
      <p>Mangsa: {pps.mangsa}</p>
    </div>
  );
}