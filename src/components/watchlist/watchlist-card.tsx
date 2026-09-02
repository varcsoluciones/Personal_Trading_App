'use client';

import React from 'react';
import { Asset } from '@/lib/types/market';
import { AssetOpportunityCard } from '@/components/shared/asset-opportunity-card';

export interface WatchlistCardProps {
  asset: Asset;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: (e: React.MouseEvent) => void;
  onOpenChart: () => void;
  onOpenBacktest: () => void;
}

export function WatchlistCard({
  asset,
  isSelected,
  onSelect,
  onRemove,
  onOpenChart,
  onOpenBacktest,
}: WatchlistCardProps) {
  return (
    <AssetOpportunityCard
      asset={asset}
      isSelected={isSelected}
      onSelect={onSelect}
      onRemove={onRemove}
      onOpenChart={onOpenChart}
      onOpenBacktest={onOpenBacktest}
    />
  );
}
