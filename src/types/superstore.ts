/**
 * Superstore Marketplace Types
 * Specific to Bangladeshi Superstores: Shwapno, Meena Bazar, and Agora
 */

export type ESuperstore = "Shwapno" | "Meena Bazar" | "Agora";

export type TStockStatus = "in_stock" | "out_of_stock" | "low_stock";

export interface ISuperstorePriceInfo {
  storeName: ESuperstore;
  storeUrl: string;
  productTitle: string;
  priceBDT: number;
  originalPriceBDT?: number;
  isAvailable: boolean;
  stockStatus: TStockStatus;
  isBestPrice?: boolean;
  itemUrl?: string;
  lastUpdated?: string;
}

export interface IItemMarketplaceComparison {
  itemId?: string;
  query: string;
  bestPriceStore: ESuperstore;
  bestPriceBDT: number;
  storePrices: ISuperstorePriceInfo[];
  savingsAmountBDT: number;
}

export interface IBasketOptimizationResult {
  familyId: string;
  totalItemsCount: number;
  cheapestStoreName: ESuperstore;
  cheapestTotalBDT: number;
  storeTotals: {
    storeName: ESuperstore;
    totalBDT: number;
    availableItemsCount: number;
    missingItemsCount: number;
  }[];
  potentialSavingsBDT: number;
}

export interface IStoreSplitItemAllocation {
  itemName: string;
  bestStoreName: ESuperstore;
  priceBDT: number;
}

export interface IBasketSplitOptimizationResult {
  familyId: string;
  totalItemsCount: number;
  itemAllocations: IStoreSplitItemAllocation[];
  splitTotalBDT: number;
  singleStoreCheapestBDT: number;
  extraSplitSavingsBDT: number;
  storeBreakdown: Record<ESuperstore, number>;
}

export interface IPriceAlert {
  id: string;
  familyId: string;
  query: string;
  targetPriceBDT: number;
  unit?: string;
  currentBestPriceBDT?: number;
  currentBestStore?: ESuperstore;
  isTriggered: boolean;
  createdAt: string;
}

export interface ICreatePriceAlertPayload {
  familyId: string;
  query: string;
  targetPriceBDT: number;
  unit?: string;
}
