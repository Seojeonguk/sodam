/**
 * 게스트 데이터 → 서버 마이그레이션 (Supabase Auth)
 *
 * 순서:
 * 1. 온라인 여부 확인
 * 2. Supabase 회원가입
 * 3. Supabase 로그인 (액세스 토큰 발급)
 * 4. 가계부 생성
 * 5. 카테고리 업로드 (게스트 ID → 서버 ID 매핑)
 * 6. 거래 업로드 (매핑된 카테고리 ID 사용)
 * 7. 게스트 데이터 삭제
 */

import accountBookApi from "../../../entities/accountbook/api/accountBookApi";
import categoryApi from "../../../entities/category/api/categoryApi";
import transactionApi from "../../../entities/transaction/api/transactionApi";
import { supabase } from "../../../shared/lib/supabase";
import { setAccessToken } from "../../../shared/api/api";
import { guestMode } from "../../../shared/lib/guestMode";
import { guestStore } from "../../../entities/guest/lib/guestStore";
import { sessionCache } from "../../../shared/lib/localCache";

export interface MigrationProgress {
  step: "signup" | "login" | "accountbook" | "categories" | "transactions" | "done";
  current: number;
  total: number;
}

export type ProgressCallback = (progress: MigrationProgress) => void;

export interface MigrationResult {
  categories: number;
  transactions: number;
}

export async function migrateGuestData(
  email: string,
  password: string,
  name: string,
  onProgress?: ProgressCallback,
): Promise<MigrationResult> {
  // ── 0. 온라인 여부 사전 확인 ───────────────────────────────────────────────
  if (!navigator.onLine) {
    throw new Error("오프라인 상태입니다. 네트워크에 연결된 후 다시 시도해 주세요.");
  }

  const report = (step: MigrationProgress["step"], current = 0, total = 0) =>
    onProgress?.({ step, current, total });

  // ── 1. 회원가입 (Supabase) ─────────────────────────────────────────────────
  report("signup");
  const { error: signupError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (signupError) {
    throw new Error(signupError.message ?? "회원가입에 실패했습니다.");
  }

  // ── 2. 로그인 (토큰 발급) ──────────────────────────────────────────────────
  report("login");
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (loginError || !loginData.session) {
    throw new Error(loginError?.message ?? "로그인에 실패했습니다.");
  }
  setAccessToken(loginData.session.access_token);
  sessionCache.set(email, name);
  // 이후 단계(가계부/카테고리/거래 업로드)가 게스트 로컬 저장소가 아닌 실제
  // 서버로 반영되도록, 로그인 성공 직후 게스트 모드를 해제한다.
  guestMode.disable();

  // ── 3. 가계부 생성 ─────────────────────────────────────────────────────────
  report("accountbook");
  // 게스트가 직접 만든 카테고리를 그대로 업로드하므로 기본 카테고리는 시딩하지 않는다
  const accountBook = await accountBookApi.createAccountBook("나의 가계부", {
    seedDefaultCategories: false,
  });
  const serverAccountBookId = accountBook.id;

  // ── 4. 카테고리 업로드 ─────────────────────────────────────────────────────
  const guestCategories = guestStore.getCategories(0, 1000).categories;
  const categoryIdMap = new Map<number, number>(); // 게스트ID → 서버ID

  for (let i = 0; i < guestCategories.length; i++) {
    const cat = guestCategories[i];
    report("categories", i + 1, guestCategories.length);
    try {
      const serverCat = await categoryApi.createCategory({
        name: cat.name,
        description: cat.description,
        color: cat.color ?? undefined,
        type: cat.type as "INCOME" | "EXPENSE",
        accountBookSeq: serverAccountBookId,
      });
      categoryIdMap.set(cat.id, serverCat.id);
    } catch {
      // 개별 카테고리 업로드 실패는 건너뛰고 나머지 항목 계속 진행
    }
  }

  // ── 5. 거래 업로드 ─────────────────────────────────────────────────────────
  const rawTransactions = guestStore.getRawTransactions();

  for (let i = 0; i < rawTransactions.length; i++) {
    const tx = rawTransactions[i];
    report("transactions", i + 1, rawTransactions.length);
    try {
      const serverCategoryId =
        tx.categorySeq != null ? (categoryIdMap.get(tx.categorySeq) ?? null) : null;

      await transactionApi.createTransaction({
        accountBookSeq: serverAccountBookId,
        type: tx.type,
        amount: tx.amount,
        categorySeq: serverCategoryId,
        description: tx.description,
        transactionDate: tx.transactionDate,
      });
    } catch {
      // 개별 거래 업로드 실패는 건너뛰고 나머지 항목 계속 진행
    }
  }

  // ── 6. 게스트 데이터 삭제 ──────────────────────────────────────────────────
  report("done");
  guestMode.clearAll();

  return {
    categories: guestCategories.length,
    transactions: rawTransactions.length,
  };
}
