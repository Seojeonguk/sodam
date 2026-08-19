/**
 * Supabase Auth 로그인 후 public.users 테이블 동기화
 * - BIGSERIAL user id (user_seq) 를 캐싱해서 모든 API 모듈이 재사용
 */
import dayjs from "dayjs";
import { supabase } from "./supabase";

/** 기본 카테고리 목록 */
const DEFAULT_CATEGORIES = [
  { name: "식비",        type: "EXPENSE", color: "#FF6B6B", description: "식사, 카페, 배달" },
  { name: "교통",        type: "EXPENSE", color: "#4ECDC4", description: "대중교통, 주유, 주차" },
  { name: "쇼핑",        type: "EXPENSE", color: "#45B7D1", description: "의류, 생활용품" },
  { name: "의료/건강",   type: "EXPENSE", color: "#96CEB4", description: "병원, 약국, 운동" },
  { name: "문화/여가",   type: "EXPENSE", color: "#FFEAA7", description: "영화, 여행, 취미" },
  { name: "통신",        type: "EXPENSE", color: "#DDA0DD", description: "핸드폰, 인터넷" },
  { name: "주거/공과금", type: "EXPENSE", color: "#F0A500", description: "월세, 전기, 가스" },
  { name: "급여",        type: "INCOME",  color: "#55EFC4", description: "월급, 연봉" },
  { name: "부수입",      type: "INCOME",  color: "#74B9FF", description: "프리랜서, 용돈" },
];

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
 * 기존 유저의 기본 데이터(가계부, 분류, 카테고리)가 빠진 경우 보완.
 * - 가계부 없으면 생성
 * - classification(INCOME/EXPENSE) 없으면 생성
 * - 기본 카테고리 없으면 생성
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
    const { data: book, error: bookErr } = await supabase
      .from("account_book")
      .insert({
        name: "가계부",
        created_at: now,
        created_by: userId,
        updated_at: now,
        updated_by: userId,
      })
      .select("id")
      .single();

    if (bookErr || !book) return;

    accountBookId = book.id as number;

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
  const toInsert = (["INCOME", "EXPENSE", "TRANSFER"] as const)
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

  // 기본 카테고리 보완 — 카테고리가 하나라도 있으면 스킵 (사용자 커스텀 보호)
  const { count: catCount } = await supabase
    .from("category")
    .select("*", { count: "exact", head: true })
    .eq("user_seq", userId);

  if ((catCount ?? 0) === 0) {
    await supabase.from("category").insert(
      DEFAULT_CATEGORIES.map((c) => ({ ...c, user_seq: userId, created_at: now, updated_at: now })),
    );
  }
}

/**
 * 로그인/가입 시 pending_invites 처리.
 * 해당 이메일로 초대된 가계부가 있으면 자동으로 멤버 추가 후 invite 삭제.
 */
async function processPendingInvites(userId: number, email: string): Promise<void> {
  const { data: invites } = await supabase
    .from("pending_invites")
    .select("id, account_book_id, authority, invited_by, expires_at")
    .eq("invited_email", email);

  if (!invites || invites.length === 0) return;

  const now = dayjs().format("YYYYMMDDHHmmss");

  for (const invite of invites) {
    // 만료된 초대는 삭제만
    if ((invite.expires_at as string) < now) {
      await supabase.from("pending_invites").delete().eq("id", invite.id);
      continue;
    }

    // 멤버 추가 (이미 멤버인 경우 오류 무시)
    await supabase.from("account_book_member").insert({
      account_book_id: invite.account_book_id,
      user_id: userId,
      authority: invite.authority,
      is_available: "Y",
      created_at: now,
      created_by: invite.invited_by,
      updated_at: now,
      updated_by: invite.invited_by,
    });

    // 처리된 초대 삭제
    await supabase.from("pending_invites").delete().eq("id", invite.id);
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
    // 미가입 상태에서 받은 초대 처리 (백그라운드)
    void processPendingInvites(cachedUserSeq, email);
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

  // 기본 분류 생성 (INCOME / EXPENSE / TRANSFER)
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
    {
      name: "TRANSFER",
      account_book_seq: book.id,
      created_at: now,
      updated_at: now,
    },
  ]);

  if (classErr) throw new Error("분류 생성 실패: " + classErr.message);

  // 기본 카테고리 생성
  const { error: catErr } = await supabase.from("category").insert(
    DEFAULT_CATEGORIES.map((c) => ({
      ...c,
      user_seq: userId,
      created_at: now,
      updated_at: now,
    })),
  );

  if (catErr) throw new Error("카테고리 생성 실패: " + catErr.message);

  cachedUserSeq = userId;

  // 신규 유저: 기존에 받아둔 초대 처리 (백그라운드)
  void processPendingInvites(userId, email);

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
