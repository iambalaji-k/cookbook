'use client';

import { useState } from 'react';

export interface IngredientUnitSelectProps {
  value: string;
  onChange: (unit: string) => void;
  className?: string;
  placeholder?: string;
}

export const STANDARD_UNIT_GROUPS = [
  {
    label: 'Whole / Count',
    units: [{ value: '', label: 'Whole (No unit)' }],
  },
  {
    label: 'Volume',
    units: [
      { value: 'cup', label: 'cup (Cups)' },
      { value: 'tbsp', label: 'tbsp (Tablespoon)' },
      { value: 'tsp', label: 'tsp (Teaspoon)' },
      { value: 'fl oz', label: 'fl oz (Fluid Ounce)' },
      { value: 'ml', label: 'ml (Milliliter)' },
      { value: 'l', label: 'l (Liter)' },
      { value: 'pt', label: 'pt (Pint)' },
      { value: 'qt', label: 'qt (Quart)' },
    ],
  },
  {
    label: 'Mass / Weight',
    units: [
      { value: 'g', label: 'g (Gram)' },
      { value: 'kg', label: 'kg (Kilogram)' },
      { value: 'oz', label: 'oz (Ounce)' },
      { value: 'lb', label: 'lb (Pound)' },
    ],
  },
  {
    label: 'Countable / Items',
    units: [
      { value: 'clove', label: 'clove (e.g. Garlic)' },
      { value: 'head', label: 'head (e.g. Garlic, Cabbage)' },
      { value: 'bunch', label: 'bunch (e.g. Herbs, Spinach)' },
      { value: 'pinch', label: 'pinch (e.g. Salt, Spice)' },
      { value: 'dash', label: 'dash (e.g. Sauce)' },
      { value: 'can', label: 'can (e.g. Tomatoes)' },
      { value: 'slice', label: 'slice (e.g. Bread, Cheese)' },
      { value: 'stalk', label: 'stalk (e.g. Celery)' },
      { value: 'sprig', label: 'sprig (e.g. Rosemary)' },
      { value: 'leaf', label: 'leaf (e.g. Bay Leaf)' },
      { value: 'piece', label: 'piece (Generic Item)' },
    ],
  },
];

const PRESET_VALUES = new Set<string>([
  '',
  'cup', 'cups', 'tbsp', 'tbsps', 'tablespoon', 'tablespoons',
  'tsp', 'tsps', 'teaspoon', 'teaspoons',
  'fl oz', 'fluid oz', 'fluid ounce', 'fluid ounces',
  'ml', 'milliliter', 'milliliters', 'l', 'liter', 'liters',
  'pt', 'pint', 'pints', 'qt', 'quart', 'quarts',
  'g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms',
  'oz', 'ounce', 'ounces', 'lb', 'lbs', 'pound', 'pounds',
  'clove', 'cloves', 'head', 'heads', 'bunch', 'bunches',
  'pinch', 'pinches', 'dash', 'dashes', 'can', 'cans',
  'slice', 'slices', 'stalk', 'stalks', 'sprig', 'sprigs',
  'leaf', 'leaves', 'piece', 'pieces',
]);

export function IngredientUnitSelect({
  value,
  onChange,
  className = '',
  placeholder = 'Select Unit',
}: IngredientUnitSelectProps) {
  const normalizedVal = (value || '').trim().toLowerCase();
  const isPreset = PRESET_VALUES.has(normalizedVal);
  const [customModeOverride, setCustomModeOverride] = useState<boolean | null>(null);

  const isCustomMode =
    customModeOverride !== null
      ? customModeOverride
      : (!isPreset && normalizedVal !== '');

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === '__CUSTOM__') {
      setCustomModeOverride(true);
      onChange('');
    } else {
      setCustomModeOverride(false);
      onChange(selected);
    }
  };

  if (isCustomMode) {
    return (
      <div className="flex items-center gap-1.5 w-full">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Custom unit (e.g. bottle)..."
          className={`w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-orange-500/50 text-neutral-100 text-xs focus:outline-none focus:border-orange-500 ${className}`}
          autoFocus
        />
        <button
          type="button"
          onClick={() => {
            setCustomModeOverride(false);
            onChange('');
          }}
          className="px-2 py-1 text-[10px] text-zinc-400 hover:text-white rounded bg-neutral-900 border border-neutral-800 transition-colors shrink-0 font-mono"
          title="Back to dropdown presets"
        >
          Preset List
        </button>
      </div>
    );
  }

  // Canonicalize value to match select option values
  let selectedOptionValue = normalizedVal;
  if (normalizedVal === 'cups') selectedOptionValue = 'cup';
  if (['tbsps', 'tablespoon', 'tablespoons'].includes(normalizedVal)) selectedOptionValue = 'tbsp';
  if (['tsps', 'teaspoon', 'teaspoons'].includes(normalizedVal)) selectedOptionValue = 'tsp';
  if (['fluid oz', 'fluid ounce', 'fluid ounces'].includes(normalizedVal)) selectedOptionValue = 'fl oz';
  if (['milliliter', 'milliliters'].includes(normalizedVal)) selectedOptionValue = 'ml';
  if (['liter', 'liters'].includes(normalizedVal)) selectedOptionValue = 'l';
  if (['pint', 'pints'].includes(normalizedVal)) selectedOptionValue = 'pt';
  if (['quart', 'quarts'].includes(normalizedVal)) selectedOptionValue = 'qt';
  if (['gram', 'grams'].includes(normalizedVal)) selectedOptionValue = 'g';
  if (['kilogram', 'kilograms'].includes(normalizedVal)) selectedOptionValue = 'kg';
  if (['ounce', 'ounces'].includes(normalizedVal)) selectedOptionValue = 'oz';
  if (['lbs', 'pound', 'pounds'].includes(normalizedVal)) selectedOptionValue = 'lb';
  if (normalizedVal === 'cloves') selectedOptionValue = 'clove';
  if (normalizedVal === 'heads') selectedOptionValue = 'head';
  if (normalizedVal === 'bunches') selectedOptionValue = 'bunch';
  if (normalizedVal === 'pinches') selectedOptionValue = 'pinch';
  if (normalizedVal === 'dashes') selectedOptionValue = 'dash';
  if (normalizedVal === 'cans') selectedOptionValue = 'can';
  if (normalizedVal === 'slices') selectedOptionValue = 'slice';
  if (normalizedVal === 'stalks') selectedOptionValue = 'stalk';
  if (normalizedVal === 'sprigs') selectedOptionValue = 'sprig';
  if (normalizedVal === 'leaves') selectedOptionValue = 'leaf';
  if (normalizedVal === 'pieces') selectedOptionValue = 'piece';

  return (
    <select
      value={selectedOptionValue}
      onChange={handleSelectChange}
      className={`w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 text-xs focus:outline-none focus:border-orange-500 font-sans cursor-pointer ${className}`}
    >
      {STANDARD_UNIT_GROUPS.map((group) => (
        <optgroup key={group.label} label={group.label} className="bg-neutral-900 text-zinc-300 font-semibold">
          {group.units.map((unit) => (
            <option key={unit.value} value={unit.value} className="bg-neutral-950 text-neutral-100 py-1">
              {unit.label}
            </option>
          ))}
        </optgroup>
      ))}
      <optgroup label="Custom Option" className="bg-neutral-900 text-zinc-300 font-semibold">
        <option value="__CUSTOM__" className="bg-neutral-950 text-orange-400 font-semibold">
          + Custom / Other Unit...
        </option>
      </optgroup>
    </select>
  );
}
