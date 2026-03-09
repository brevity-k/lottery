'use client';

import { useState, useMemo } from 'react';
import { LotteryConfig } from '@/lib/lotteries/types';
import type { NumberSet, LotterySlug } from '@/lib/lotteries/types';
import Button from '@/components/ui/Button';

interface Props {
  lotteries: LotteryConfig[];
  onSave: (set: Omit<NumberSet, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  editingSet?: NumberSet;
}

export default function NumberSetForm({ lotteries, onSave, onCancel, editingSet }: Props) {
  const activeLotteries = lotteries.filter(l => !l.retiredDate);
  const [game, setGame] = useState<LotterySlug>(editingSet?.game || activeLotteries[0]?.slug as LotterySlug);
  const [name, setName] = useState(editingSet?.name || '');
  const [numbers, setNumbers] = useState<string[]>(
    editingSet?.numbers.map(String) || Array(activeLotteries[0]?.mainNumbers.count || 5).fill('')
  );
  const [bonus, setBonus] = useState(editingSet?.bonusNumber?.toString() || '');
  const [customNote, setCustomNote] = useState(editingSet?.customNote || '');
  const [startDate, setStartDate] = useState(editingSet?.startDate || '');

  const lottery = lotteries.find(l => l.slug === game);
  const hasBonus = lottery ? lottery.bonusNumber.count > 0 : false;

  const handleGameChange = (slug: string) => {
    const newLottery = lotteries.find(l => l.slug === slug);
    if (!newLottery) return;
    setGame(slug as LotterySlug);
    setNumbers(Array(newLottery.mainNumbers.count).fill(''));
    setBonus('');
  };

  const handleNumberChange = (index: number, value: string) => {
    setNumbers(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const isValid = useMemo(() => {
    if (!lottery || !name.trim()) return false;
    const parsed = numbers.map(n => parseInt(n, 10));
    if (parsed.some(n => isNaN(n) || n < 1 || n > lottery.mainNumbers.max)) return false;
    if (new Set(parsed).size !== parsed.length) return false;
    if (hasBonus) {
      const b = parseInt(bonus, 10);
      if (isNaN(b) || b < 1 || b > lottery.bonusNumber.max) return false;
    }
    return true;
  }, [lottery, name, numbers, bonus, hasBonus]);

  const handleSubmit = () => {
    if (!isValid || !lottery) return;
    onSave({
      name: name.trim(),
      game,
      numbers: numbers.map(n => parseInt(n, 10)).sort((a, b) => a - b),
      bonusNumber: hasBonus ? parseInt(bonus, 10) : undefined,
      customNote: customNote.trim() || undefined,
      startDate: startDate || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Set Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="My Lucky Numbers"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={50}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Game</label>
        <select
          value={game}
          onChange={e => handleGameChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {activeLotteries.map(l => (
            <option key={l.slug} value={l.slug}>{l.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Numbers ({lottery?.mainNumbers.count} from 1-{lottery?.mainNumbers.max})
        </label>
        <div className="flex flex-wrap gap-2">
          {numbers.map((val, i) => (
            <input
              key={i}
              type="number"
              min="1"
              max={lottery?.mainNumbers.max}
              value={val}
              onChange={e => handleNumberChange(i, e.target.value)}
              placeholder={`#${i + 1}`}
              className="w-16 rounded-lg border border-gray-300 px-2 py-2.5 text-center text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          ))}
        </div>
      </div>

      {hasBonus && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {lottery?.bonusNumber.label} (1-{lottery?.bonusNumber.max})
          </label>
          <input
            type="number"
            min="1"
            max={lottery?.bonusNumber.max}
            value={bonus}
            onChange={e => setBonus(e.target.value)}
            className="w-16 rounded-lg border border-red-300 px-2 py-2.5 text-center text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Started Playing (optional)</label>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Your Rationale (optional)</label>
        <textarea
          value={customNote}
          onChange={e => setCustomNote(e.target.value)}
          placeholder="Why did you pick these numbers?"
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={200}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="primary" onClick={handleSubmit} disabled={!isValid}>
          {editingSet ? 'Update' : 'Save'}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
