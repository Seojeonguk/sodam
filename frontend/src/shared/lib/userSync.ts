/**
 * Supabase Auth 로그인 후 public.users 테이블 동기화
 * - BIGSERIAL user id (user_seq) 를 캐싱해서 모든 API 모듈이 재사용
 */
import dayjs from "dayjs";
import { supabase } from "./supabase";

let cachedUserSeq: number | null = null;

/** 캐시 초기화 (로그아웃 시 호출) */
export function clearUserSeq(): void {
  cachedUserSeq = null;
}

/** 현재 캐시된 userSeq 반환 (동기) */
export function getCachedUserSeq(): number | null {
  return cachedUserSeq;
}

/**
 * 기존 유저의 기본 데이터(가계부, 분류)가 빠진 경우 보완.
 * - 가계부 없으면 생성
 * - classification(INCOME/EXPENSE) 없으면 생성
 * 외부에서 "기본 데이터 초기화" 버튼으로도 호출 가능.
 */
export async function ensureDefaultData(userId: number): Promise<void> {
  const now = dayjs().format("YYYYMMDDHHmmss");

  // 가계부 멤버십 조회
  const { data: memberships } = await supabase
    .from("account_book_member")
    .select("account_book_id")
    .eq("user_id", userId);

  let accountBookId: number;

  if (!memberships || memberships.length === 0) {
    // 가계부가 없으면 생성
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log(session);
    console.log(session?.user);
    console.log(session?.user?.email);

    const { data: book, error: bookErr } = await supabase
      .from("account_book")
      .insert({
        name: "가계부",
        created_at: now,
        created_by: userId,
        updated_at: now,
        updated_by: userId,
      });

    if (bookErr || !book) return;
    accountBookId = 0;
    // accountBookId = book.id as number;

    await supabase.from("account_book_member").insert({
      account_book_id: accountBookId,
      user_id: userId,
      authority: "OWNER",
      is_available: "Y",
      created_at: now,
      created_by: userId,
      updated_at: now,
      updated_by: userId,
    });
  } else {
    accountBookId = memberships[0].account_book_id as number;
  }

  // classification 누락 보완
  const { data: existing } = await supabase
    .from("classification")
    .select("name")
    .eq("account_book_seq", accountBookId);

  const existingNames = new Set(
    (existing ?? []).map((r: { name: string }) => r.name),
  );
  const toInsert = (["INCOME", "EXPENSE"] as const)
    .filter((n) => !existingNames.has(n))
    .map((name) => ({
      name,
      account_book_seq: accountBookId,
      created_at: now,
      updated_at: now,
    }));

  if (toInsert.length > 0) {
    await supabase.from("classification").insert(toInsert);
  }
}

/**
 * Supabase 세션에서 email/name을 읽어 users 테이블에 동기화.
 * 이미 존재하면 id만 반환, 없으면 user + 기본 가계부 생성.
 */
export async function syncUser(email: string, name: string): Promise<number> {
  if (cachedUserSeq != null) return cachedUserSeq;

  // 이미 존재하는지 확인
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing?.id) {
    cachedUserSeq = existing.id as number;
    // 기존 유저도 기본 데이터 보완 (백그라운드, 실패해도 무시)
    void ensureDefaultData(cachedUserSeq);
    return cachedUserSeq;
  }

  // 신규 사용자 생성
  const { data: newUser, error: userErr } = await supabase
    .from("users")
    .insert({ email, name, role: "USER" })
    .select("id")
    .single();

  if (userErr || !newUser)
    throw new Error("사용자 생성 실패: " + userErr?.message);

  const userId = newUser.id as number;
  const now = dayjs().format("YYYYMMDDHHmmss");

  // 기본 가계부 생성
  const { data: book, error: bookErr } = await supabase
    .from("account_book")
    .insert({
      name: "나의 가계부",
      created_at: now,
      created_by: userId,
      updated_at: now,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (bookErr || !book)
    throw new Error("가계부 생성 실패: " + bookErr?.message);

  // OWNER로 멤버 등록
  const { error: memberErr } = await supabase
    .from("account_book_member")
    .insert({
      account_book_id: book.id,
      user_id: userId,
      authority: "OWNER",
      is_available: "Y",
      created_at: now,
      created_by: userId,
      updated_at: now,
      updated_by: userId,
    });

  if (memberErr) throw new Error("멤버 등록 실패: " + memberErr.message);

  // 기본 분류 생성 (INCOME / EXPENSE)
  const { error: classErr } = await supabase.from("classification").insert([
    {
      name: "INCOME",
      account_book_seq: book.id,
      created_at: now,
      updated_at: now,
    },
    {
      name: "EXPENSE",
      account_book_seq: book.id,
      created_at: now,
      updated_at: now,
    },
  ]);

  if (classErr) throw new Error("분류 생성 실패: " + classErr.message);

  cachedUserSeq = userId;
  return userId;
}

/**
 * 현재 Supabase 세션에서 userSeq 반환.
 * 캐시에 없으면 세션 → syncUser 실행.
 */
export async function getUserSeq(): Promise<number> {
  if (cachedUserSeq != null) return cachedUserSeq;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.email) {
    throw new Error("인증되지 않은 사용자입니다.");
  }

  const email = session.user.email;
  const name =
    (session.user.user_metadata?.full_name as string | undefined) ??
    (session.user.user_metadata?.name as string | undefined) ??
    email.split("@")[0];

  return syncUser(email, name);
}
