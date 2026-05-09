import React from 'react';
import { PPS } from '@/app/actions';

interface SidebarProps {
  ppsData: PPS[];
  isOpen: boolean;
  onClose: () => void;
  onShelterClick: (pps: PPS) => void;
}


export default function Sidebar({ ppsData, isOpen, onClose }: SidebarProps) {





    return (
        <div className=''>
            
        </div>
    )


}