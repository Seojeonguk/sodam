/**
 * 게스트 모드용 localStorage CRUD 저장소
 * 실제 API 응답과 동일한 shape을 반환합니다.
 */

import type { AccountBookListResponse } from "../../entities/accountbook/api/accountbook.types";
import type {
  TransactionCreateRequestDto,
  TransactionListItemResponse,
  TransactionListResponse,
  TransactionResponseDto,
  TransactionUpdateRequestDto,
} from "../../entities/transaction/api/transaction.types";
import type {
  CategoryListItemResponse,
  CategoryListResponse,
} from "../../entities/transaction/api/category.types";
import type {
  StatPeriodResponse,
  StatResponse,
} from "../../entities/transaction/api/stat.types";
import type {
  BudgetRequest,
  BudgetResponse,
  BudgetSummaryResponse,
} from "../../entities/budget/api/budget.types";

// ─── 키 ──────────────────────────────────────────────────────────────────────
const KEYS = {
  transactions: "sodam_guest_transactions",
  categories: "sodam_guest_categories",
  counter: "sodam_guest_counter",
  budgets: "sodam_guest_budgets",
} as const;

// ─── 내부 Budget 저장 타입 ────────────────────────────────────────────────────
interface StoredBudget {
  id: number;
  accountBookSeq: number;
  categorySeq: number;
  yearMonth: string;
  amount: number;
}

// ─── 내부 저장 타입 ───────────────────────────────────────────────────────────
export interface StoredTransaction {
  seq: number;
  accountBookSeq: number;
  categorySeq: number | null;
  categoryName: string | null;
  amount: number;
  description: string;
  transactionDate: string;
  type: "INCOME" | "EXPENSE";
  satisfactionRating: number;
}

// ─── 고정 게스트 가계부 ───────────────────────────────────────────────────────
export const GUEST_ACCOUNT_BOOK: AccountBookListResponse = {
  id: -1,
  name: "나의 가계부",
  isOwner: true,
  canEdit: true,
};

// ─── 기본 카테고리 ────────────────────────────────────────────────────────────
const DEFAULT_CATEGORIES: CategoryListItemResponse[] = [
  { id: 1, name: "식비",     description: "음식·식료품",    color: "#ef4444", type: "EXPENSE" },
  { id: 2, name: "교통",     description: "대중교통·주유",  color: "#f97316", type: "EXPENSE" },
  { id: 3, name: "문화/여가", description: "영화·취미·여행", color: "#8b5cf6", type: "EXPENSE" },
  { id: 4, name: "의료/건강", description: "병원·약국·운동", color: "#06b6d4", type: "EXPENSE" },
  { id: 5, name: "쇼핑",     description: "의류·생활용품",  color: "#ec4899", type: "EXPENSE" },
  { id: 6, name: "월급",     description: "급여·보너스",    color: "#22c55e", type: "INCOME"  },
  { id: 7, name: "기타수입", description: "용돈·부수입",    color: "#84cc16", type: "INCOME"  },
];

// ─── 유틸 ─────────────────────────────────────────────────────────────────────
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // 무시
  }
}

function nextSeq(): number {
  const current = load<number>(KEYS.counter, 0) + 1;
  save(KEYS.counter, current);
  return current;
}

function nextCategoryId(): number {
  const cats = load<CategoryListItemResponse[]>(
    KEYS.categories,
    DEFAULT_CATEGORIES,
  );
  return cats.length > 0 ? Math.max(...cats.map((c) => c.id)) + 1 : 1;
}

/** YYYYMMDD → Date (로컬 자정) */
function parseYmd(ymd: string): Date {
  return new Date(`${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`);
}

/**
 * 다양한 날짜 형식을 ISO 문자열로 정규화
 * - "20250608103000" (YYYYMMDDHHmmss) → "2025-06-08T10:30:00"
 * - "20250608" (YYYYMMDD) → "2025-06-08"
 * - 이미 ISO 형식이면 그대로 반환
 */
function normalizeDate(dateStr: string): string {
  if (dateStr.includes("-") || dateStr.includes("T")) return dateStr;
  if (dateStr.length >= 14) {
    return (
      `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}` +
      `T${dateStr.slice(8, 10)}:${dateStr.slice(10, 12)}:${dateStr.slice(12, 14)}`
    );
  }
  if (dateStr.length === 8) {
    return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
  }
  return dateStr;
}

function isInRange(transactionDate: string, start: Date, end: Date): boolean {
  const d = new Date(normalizeDate(transactionDate));
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return day >= s && day <= e;
}

// ─── 공개 API ─────────────────────────────────────────────────────────────────
export const guestStore = {
  // ── 가계부 ──────────────────────────────────────────────────────────────────
  getAccountBooks(): AccountBookListResponse[] {
    return [GUEST_ACCOUNT_BOOK];
  },

  // ── 카테고리 ─────────────────────────────────────────────────────────────────
  getCategories(page = 0, size = 100, type?: "INCOME" | "EXPENSE"): CategoryListResponse {
    const all = load<CategoryListItemResponse[]>(
      KEYS.categories,
      DEFAULT_CATEGORIES,
    );
    const filtered = type ? all.filter((c) => c.type === type) : all;
    const start = page * size;
    const items = filtered.slice(start, start + size);
    return {
      categories: items,
      pageNumber: page,
      pageSize: size,
      totalElements: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / size)),
    };
  },

  getCategoryById(id: number): CategoryListItemResponse | null {
    const all = load<CategoryListItemResponse[]>(
      KEYS.categories,
      DEFAULT_CATEGORIES,
    );
    return all.find((c) => c.id === id) ?? null;
  },

  createCategory(data: {
    name: string;
    description?: string;
    color?: string;
    type: "INCOME" | "EXPENSE";
  }): CategoryListItemResponse {
    const all = load<CategoryListItemResponse[]>(
      KEYS.categories,
      DEFAULT_CATEGORIES,
    );
    const cat: CategoryListItemResponse = {
      id: nextCategoryId(),
      name: data.name,
      description: data.description ?? "",
      color: data.color ?? null,
      type: data.type,
    };
    save(KEYS.categories, [...all, cat]);
    return cat;
  },

  updateCategory(
    id: number,
    data: { name: string; description?: string; color?: string },
  ): CategoryListItemResponse {
    const all = load<CategoryListItemResponse[]>(
      KEYS.categories,
      DEFAULT_CATEGORIES,
    );
    const updated = all.map((c) =>
      c.id === id ? { ...c, ...data, color: data.color ?? c.color } : c,
    );
    save(KEYS.categories, updated);
    // 해당 카테고리 이름 사용한 거래도 갱신
    const transactions = load<StoredTransaction[]>(KEYS.transactions, []);
    const updatedName = data.name;
    save(
      KEYS.transactions,
      transactions.map((t) =>
        t.categorySeq === id ? { ...t, categoryName: updatedName } : t,
      ),
    );
    return updated.find((c) => c.id === id)!;
  },

  deleteCategory(id: number, replacementId: number): void {
    const all = load<CategoryListItemResponse[]>(
      KEYS.categories,
      DEFAULT_CATEGORIES,
    );
    const replacement = all.find((c) => c.id === replacementId) ?? null;
    save(
      KEYS.categories,
      all.filter((c) => c.id !== id),
    );
    // 해당 카테고리 사용한 거래를 대체 카테고리로 변경
    const transactions = load<StoredTransaction[]>(KEYS.transactions, []);
    save(
      KEYS.transactions,
      transactions.map((t) =>
        t.categorySeq === id
          ? {
              ...t,
              categorySeq: replacement?.id ?? null,
              categoryName: replacement?.name ?? null,
            }
          : t,
      ),
    );
  },

  // ── 거래 ─────────────────────────────────────────────────────────────────────
  getTransactions(
    _accountId: number,
    startDate?: string,
    endDate?: string,
    page = 0,
    size = 10,
    categorySeqs?: number[],
    keyword?: string,
    minAmount?: number,
    maxAmount?: number,
  ): TransactionListResponse {
    const all = load<StoredTransaction[]>(KEYS.transactions, []);
    let filtered = all;

    if (startDate && endDate) {
      const start = parseYmd(startDate);
      const end = parseYmd(endDate);
      filtered = filtered.filter((t) => isInRange(t.transactionDate, start, end));
    }

    if (categorySeqs && categorySeqs.length > 0) {
      filtered = filtered.filter((t) => t.categorySeq != null && categorySeqs.includes(t.categorySeq));
    }

    if (keyword && keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      filtered = filtered.filter((t) => t.description?.toLowerCase().includes(kw));
    }

    if (minAmount != null) {
      filtered = filtered.filter((t) => t.amount >= minAmount);
    }

    if (maxAmount != null) {
      filtered = filtered.filter((t) => t.amount <= maxAmount);
    }

    const totalElements = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalElements / size));
    const safePage = Math.min(page, totalPages - 1);
    const paged = filtered.slice(safePage * size, safePage * size + size);

    const items: TransactionListItemResponse[] = paged.map((t) => ({
      seq: t.seq,
      amount: t.amount,
      description: t.description,
      transactionDate: t.transactionDate,
      type: t.type,
      categoryName: t.categoryName,
    }));

    return {
      transactions: items,
      pageNumber: safePage,
      pageSize: size,
      totalElements,
      totalPages,
    };
  },

  createTransaction(data: TransactionCreateRequestDto): TransactionResponseDto {
    const all = load<StoredTransaction[]>(KEYS.transactions, []);
    const category = data.categorySeq
      ? this.getCategoryById(data.categorySeq)
      : null;
    const tx: StoredTransaction = {
      seq: nextSeq(),
      accountBookSeq: data.accountBookSeq,
      categorySeq: data.categorySeq,
      categoryName: category?.name ?? null,
      amount: data.amount,
      description: data.description ?? "",
      transactionDate: normalizeDate(data.transactionDate),
      type: data.type,
      satisfactionRating: 0,
    };
    save(KEYS.transactions, [...all, tx]);
    return toDto(tx);
  },

  getTransactionBySeq(seq: number): TransactionResponseDto | null {
    const all = load<StoredTransaction[]>(KEYS.transactions, []);
    const tx = all.find((t) => t.seq === seq);
    return tx ? toDto(tx) : null;
  },

  updateTransaction(
    seq: number,
    data: TransactionUpdateRequestDto,
  ): TransactionResponseDto {
    const all = load<StoredTransaction[]>(KEYS.transactions, []);
    const category =
      data.categorySeq != null
        ? this.getCategoryById(data.categorySeq)
        : undefined;
    const updated = all.map((t) => {
      if (t.seq !== seq) return t;
      return {
        ...t,
        ...(data.type && { type: data.type }),
        ...(data.amount != null && { amount: data.amount }),
        ...(data.description != null && { description: data.description }),
        ...(data.transactionDate && { transactionDate: data.transactionDate }),
        ...(data.categorySeq !== undefined && {
          categorySeq: data.categorySeq,
          categoryName: category?.name ?? null,
        }),
      };
    });
    save(KEYS.transactions, updated);
    return toDto(updated.find((t) => t.seq === seq)!);
  },

  deleteTransaction(seq: number): void {
    const all = load<StoredTransaction[]>(KEYS.transactions, []);
    save(
      KEYS.transactions,
      all.filter((t) => t.seq !== seq),
    );
  },

  /** 마이그레이션용: categorySeq 포함 전체 거래 반환 */
  getRawTransactions(): StoredTransaction[] {
    return load<StoredTransaction[]>(KEYS.transactions, []);
  },

  // ── 예산 ─────────────────────────────────────────────────────────────────────
  upsertBudget(data: BudgetRequest): BudgetResponse {
    const all = load<StoredBudget[]>(KEYS.budgets, []);
    const existing = all.find(
      (b) => b.accountBookSeq === data.accountBookSeq &&
             b.categorySeq === data.categorySeq &&
             b.yearMonth === data.yearMonth,
    );
    if (existing) {
      existing.amount = data.amount;
      save(KEYS.budgets, all);
      return { ...existing };
    }
    const newId = load<number>(KEYS.counter, 0) + 1;
    save(KEYS.counter, newId);
    const newBudget: StoredBudget = {
      id: newId,
      accountBookSeq: data.accountBookSeq,
      categorySeq: data.categorySeq,
      yearMonth: data.yearMonth,
      amount: data.amount,
    };
    save(KEYS.budgets, [...all, newBudget]);
    return { ...newBudget };
  },

  deleteBudget(id: number): void {
    const all = load<StoredBudget[]>(KEYS.budgets, []);
    save(KEYS.budgets, all.filter((b) => b.id !== id));
  },

  copyBudgets(accountBookSeq: number, fromYearMonth: string, toYearMonth: string): number {
    const all = load<StoredBudget[]>(KEYS.budgets, []);
    const sources = all.filter(
      (b) => b.accountBookSeq === accountBookSeq && b.yearMonth === fromYearMonth,
    );
    if (sources.length === 0) return 0;

    const updated = [...all];
    let count = 0;
    for (const src of sources) {
      const existingIdx = updated.findIndex(
        (b) => b.accountBookSeq === accountBookSeq &&
               b.categorySeq === src.categorySeq &&
               b.yearMonth === toYearMonth,
      );
      if (existingIdx >= 0) {
        updated[existingIdx] = { ...updated[existingIdx], amount: src.amount };
      } else {
        const newId = load<number>(KEYS.counter, 0) + 1;
        save(KEYS.counter, newId);
        updated.push({ id: newId, accountBookSeq, categorySeq: src.categorySeq, yearMonth: toYearMonth, amount: src.amount });
      }
      count++;
    }
    save(KEYS.budgets, updated);
    return count;
  },

  getBudgetSummary(accountBookSeq: number, yearMonth: string): BudgetSummaryResponse[] {
    const budgets = load<StoredBudget[]>(KEYS.budgets, []).filter(
      (b) => b.accountBookSeq === accountBookSeq && b.yearMonth === yearMonth,
    );
    const categories = load<CategoryListItemResponse[]>(KEYS.categories, DEFAULT_CATEGORIES);
    const transactions = load<StoredTransaction[]>(KEYS.transactions, []);

    // yearMonth → 해당 월 거래만 필터
    const start = parseYmd(yearMonth + "01");
    const endRaw = new Date(parseInt(yearMonth.slice(0, 4)), parseInt(yearMonth.slice(4, 6)), 0);
    const end = new Date(endRaw.getFullYear(), endRaw.getMonth(), endRaw.getDate());
    const monthTx = transactions.filter((t) => isInRange(t.transactionDate, start, end));

    // 카테고리별 실사용 합산
    const actualMap = new Map<number, number>();
    for (const tx of monthTx) {
      if (tx.categorySeq == null) continue;
      actualMap.set(tx.categorySeq, (actualMap.get(tx.categorySeq) ?? 0) + tx.amount);
    }

    const result: BudgetSummaryResponse[] = [];
    const processedCats = new Set<number>();

    for (const b of budgets) {
      const cat = categories.find((c) => c.id === b.categorySeq);
      const actual = actualMap.get(b.categorySeq) ?? 0;
      const ratio = b.amount > 0 ? (actual / b.amount) * 100 : -1;
      result.push({
        budgetId: b.id,
        categorySeq: b.categorySeq,
        categoryName: cat?.name ?? "미분류",
        categoryColor: cat?.color ?? null,
        categoryType: cat?.type ?? "EXPENSE",
        budgetAmount: b.amount,
        actualAmount: actual,
        ratio,
        over: actual > b.amount,
        hasBudget: true,
      });
      processedCats.add(b.categorySeq);
    }

    // 예산 미설정 카테고리
    for (const [catSeq, actual] of actualMap.entries()) {
      if (processedCats.has(catSeq)) continue;
      const cat = categories.find((c) => c.id === catSeq);
      result.push({
        budgetId: null,
        categorySeq: catSeq,
        categoryName: cat?.name ?? "미분류",
        categoryColor: cat?.color ?? null,
        categoryType: cat?.type ?? "EXPENSE",
        budgetAmount: 0,
        actualAmount: actual,
        ratio: -1,
        over: false,
        hasBudget: false,
      });
    }

    return result.sort((a, b) =>
      (b.hasBudget ? 1 : 0) - (a.hasBudget ? 1 : 0) ||
      a.categoryName.localeCompare(b.categoryName),
    );
  },

  // ── 통계 (거래 데이터에서 계산) ──────────────────────────────────────────────
  getStats(startDate: string, endDate: string, categorySeqs?: number[], keyword?: string, minAmount?: number, maxAmount?: number): StatResponse[] {
    const all = load<StoredTransaction[]>(KEYS.transactions, []);
    const start = parseYmd(startDate);
    const end = parseYmd(endDate);
    let filtered = all.filter((t) => isInRange(t.transactionDate, start, end));
    if (categorySeqs && categorySeqs.length > 0) {
      filtered = filtered.filter((t) => t.categorySeq != null && categorySeqs.includes(t.categorySeq));
    }
    if (keyword && keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      filtered = filtered.filter((t) => t.description?.toLowerCase().includes(kw));
    }
    if (minAmount != null) filtered = filtered.filter((t) => t.amount >= minAmount);
    if (maxAmount != null) filtered = filtered.filter((t) => t.amount <= maxAmount);

    const map = new Map<string, StatResponse>();
    for (const t of filtered) {
      const key = `${t.type}_${t.categoryName ?? "미분류"}`;
      const existing = map.get(key);
      if (existing) {
        existing.total += t.amount;
      } else {
        map.set(key, {
          total: t.amount,
          type: t.type,
          name: t.categoryName ?? "미분류",
        });
      }
    }
    return Array.from(map.values());
  },

  getPeriodStats(startDate: string, endDate: string, categorySeqs?: number[], keyword?: string, minAmount?: number, maxAmount?: number): StatPeriodResponse[] {
    const all = load<StoredTransaction[]>(KEYS.transactions, []);
    const start = parseYmd(startDate);
    const end = parseYmd(endDate);
    let filtered = all.filter((t) => isInRange(t.transactionDate, start, end));
    if (categorySeqs && categorySeqs.length > 0) {
      filtered = filtered.filter((t) => t.categorySeq != null && categorySeqs.includes(t.categorySeq));
    }
    if (keyword && keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      filtered = filtered.filter((t) => t.description?.toLowerCase().includes(kw));
    }
    if (minAmount != null) filtered = filtered.filter((t) => t.amount >= minAmount);
    if (maxAmount != null) filtered = filtered.filter((t) => t.amount <= maxAmount);

    const map = new Map<string, StatPeriodResponse>();
    for (const t of filtered) {
      const date = normalizeDate(t.transactionDate).slice(0, 10); // YYYY-MM-DD
      const key = `${t.type}_${date}`;
      const existing = map.get(key);
      if (existing) {
        existing.total += t.amount;
      } else {
        map.set(key, { total: t.amount, type: t.type, transaction_date: date });
      }
    }
    return Array.from(map.values());
  },
};

function toDto(t: StoredTransaction): TransactionResponseDto {
  return {
    seq: t.seq,
    accountBookSeq: t.accountBookSeq,
    categorySeq: t.categorySeq ?? undefined,
    amount: t.amount,
    description: t.description,
    transactionDate: t.transactionDate,
    type: t.type,
    satisfactionRating: t.satisfactionRating,
  };
}
