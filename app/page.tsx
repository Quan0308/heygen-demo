'use client';

import InteractiveAvatar from '@/components/InteractiveAvatar';
import NoSSWWrapper from '@/components/NoSSWWrapper';
import WebcamVideo from '@/components/WebcamVideo';

export default function App() {
  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="w-full flex flex-row items-start justify-start gap-5 mx-auto pt-4 pb-20 px-20">
        <div className="w-1/2">
          <InteractiveAvatar />
        </div>
        <div className="w-1/2">
          <NoSSWWrapper>
            <WebcamVideo />
          </NoSSWWrapper>
        </div>
      </div>
    </div>
  );
}
