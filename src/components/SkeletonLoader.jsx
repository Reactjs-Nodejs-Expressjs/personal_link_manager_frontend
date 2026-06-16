import React from 'react';

export default function SkeletonLoader({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="flex flex-col bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm animate-pulse h-[368px]">
          {/* Mock iframe image area */}
          <div className="h-[200px] w-full bg-slate-100"></div>
          
          {/* Card body loaders */}
          <div className="p-5 flex flex-col flex-1 gap-3">
            <div className="flex justify-between items-center">
              <div className="w-3/5 h-4 bg-slate-200 rounded-lg"></div>
              <div className="w-[45px] h-3.5 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="w-full h-8 bg-slate-200 rounded-lg"></div>
            <div className="w-2/5 h-3.5 bg-slate-200 rounded-lg"></div>
            
            {/* Actions button loaders */}
            <div className="flex gap-2 mt-auto">
              <div className="flex-1 h-[34px] bg-slate-200 rounded-xl"></div>
              <div className="flex-1 h-[34px] bg-slate-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
