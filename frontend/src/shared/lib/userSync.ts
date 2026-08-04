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
    return cachedUserSeq;
  }

  // 신규 사용자 생성
  const { data: newUser, error: userErr } = await supabase
    .from("users")
    .insert({ email, name, role: "USER" })
    .select("id")
    .single();

  if (userErr || !newUser) throw new Error("사용자 생성 실패: " + userErr?.message);

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

  if (bookErr || !book) throw new Error("가계부 생성 실패: " + bookErr?.message);

  // OWNER로 멤버 등록
  await supabase.from("account_book_member").insert({
    account_book_id: book.id,
    user_id: userId,
    authority: "OWNER",
    is_available: "Y",
    created_at: now,
    created_by: userId,
    updated_at: now,
    updated_by: userId,
  });

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
