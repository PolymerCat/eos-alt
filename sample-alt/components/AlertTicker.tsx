'use client';

import React, { useState } from 'react';

// AlertTicker: a bottom-of-screen moving alert / news ticker overlay.
// - Implemented as a client component so it can manage animation state and user controls.
// - Easy to extend: accept `messages` prop, customize `speed`, add formatting or links.
type Props = {
  messages?: string[]; // array of alert strings to display
  speed?: number; // duration in seconds for one loop (higher = slower)
  // CSS class that controls the centered container width.
  // Default matches typical page content: "max-w-5xl".
  // Change to "max-w-7xl" or "w-full" as needed.
  containerClass?: string;
};

export default function AlertTicker({
  messages = [
    'Welcome to EOS Flood Lookout — stay tuned for alerts.',
    'Tip: Hover to pause the ticker. Use Close to hide this bar.',
  ],
  speed = 30,
  containerClass = 'w-full',
}: Props) {
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 pointer-events-auto py-4">
      {/* container keeps ticker within site's max width; change `containerClass` to control width */}
      {/*px-2 sm:px-4 lg:px-6 */} // used at line 36 if u want padding, not full-width bar
      <div className={`mx-auto ${containerClass} `}>
        <div className="bg-yellow-300 text-black  overflow-hidden shadow-lg">
          <div className="flex items-center w-full">
            {/* Left label - customizable */}
            <div className="px-3 py-2 font-semibold bg-red-700 text-white">ALERT</div>

            {/* Scrolling track - pause on hover */}
            <div
              className="relative flex-1 overflow-hidden"
            //   onMouseEnter={() => setPaused(true)}
            //   onMouseLeave={() => setPaused(false)}
            >
              <div
                className="whitespace-nowrap"
                style={{
                  display: 'inline-block',
                  animation: paused ? 'none' : `marquee ${speed}s linear infinite`,
                }}
              >
                {/* Render messages twice to create a seamless loop */}
                {messages.map((m, i) => (
                  <span key={`m-${i}`} className="px-6">
                    {m}
                  </span>
                ))}
                {messages.map((m, i) => (
                  <span key={`m2-${i}`} className="px-6">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Controls: Pause/Play and Close - easy to replace with icons */}
            {/* <div className="flex items-center gap-2 px-2 text-white">
              <button
                aria-label={paused ? 'Play ticker' : 'Pause ticker'}
                onClick={() => setPaused((p) => !p)}
                className="px-2 py-1 bg-red-700 rounded text-sm hover:bg-red-500"
                title={paused ? 'Play' : 'Pause'}
              >
                {paused ? 'Play' : 'Pause'}
              </button>

              <button
                aria-label="Close ticker"
                onClick={() => setVisible(false)}
                className="px-2 py-1 bg-red-700 rounded text-sm hover:bg-red-500"
                title="Close"
              >
                Close
              </button>
            </div> */}
          </div>
        </div>
      </div>

      {/* Self-contained keyframes; duplicate this logic into global CSS if preferred */}
      <style>{`\n        @keyframes marquee {\n          0% { transform: translateX(0%); }\n          100% { transform: translateX(-50%); }\n        }\n      `}</style>
    </div>
  );
}