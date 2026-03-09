'use client';

import { useState } from 'react';
import { LotteryConfig } from '@/lib/lotteries/types';
import { useNumberSets } from '@/lib/hooks/useNumberSets';
import NumberSetManager from '@/components/my-numbers/NumberSetManager';
import WhatIfReport from '@/components/my-numbers/WhatIfReport';

interface Props {
  lotteries: LotteryConfig[];
}

export default function MyNumbersClient({ lotteries }: Props) {
  const { sets, hydrated, addSet, updateSet, deleteSet } = useNumberSets();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedSet = sets.find(s => s.id === selectedId) || null;

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6">
      <div className="md:sticky md:top-20 md:self-start">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <NumberSetManager
            sets={sets}
            selectedId={selectedId}
            lotteries={lotteries}
            onSelect={setSelectedId}
            onAdd={(data) => {
              addSet(data);
              // Auto-select newly added set after state updates
              setTimeout(() => {
                const latest = JSON.parse(localStorage.getItem('myLottoStats:numberSets') || '[]');
                if (latest.length > 0) setSelectedId(latest[latest.length - 1].id);
              }, 0);
            }}
            onUpdate={updateSet}
            onDelete={(id) => {
              deleteSet(id);
              if (selectedId === id) setSelectedId(null);
            }}
          />
        </div>
      </div>

      <div>
        {selectedSet ? (
          <WhatIfReport numberSet={selectedSet} lotteries={lotteries} />
        ) : (
          <div className="flex items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="text-center max-w-md">
              <p className="text-5xl mb-4">&#127921;</p>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a Number Set</h2>
              <p className="text-sm text-gray-500">
                {sets.length === 0
                  ? 'Add your first number set to see a detailed historical analysis of how your numbers would have performed.'
                  : 'Click on a number set from the sidebar to see its detailed what-if report.'
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
