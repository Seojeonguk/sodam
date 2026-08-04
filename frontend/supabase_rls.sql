-- ============================================================
-- Sodam - Supabase RLS 설정 스크립트
-- Supabase 대시보드 > SQL Editor에서 실행하세요.
-- ============================================================

-- ── 헬퍼 함수: 현재 Supabase Auth 유저의 users.id(BIGSERIAL) 반환 ──
CREATE OR REPLACE FUNCTION get_my_user_seq()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.users WHERE email = auth.email()
$$;

-- ── RLS 활성화 ──────────────────────────────────────────────
ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_book           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_book_member    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transaction  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classification         ENABLE ROW LEVEL SECURITY;

-- ── users ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_self" ON public.users;
CREATE POLICY "users_self" ON public.users
  FOR ALL
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

-- ── account_book ─────────────────────────────────────────────
-- 자신이 멤버인 가계부에만 접근 가능
DROP POLICY IF EXISTS "account_book_member_access" ON public.account_book;
CREATE POLICY "account_book_member_access" ON public.account_book
  FOR ALL
  USING (
    id IN (
      SELECT account_book_id
      FROM public.account_book_member
      WHERE user_id = get_my_user_seq()
    )
  );

-- ── account_book_member ───────────────────────────────────────
-- 자신이 속한 가계부의 멤버 목록 조회 가능
-- 가계부 OWNER만 초대/수정/삭제 가능 (선택 사항 - 현재는 전체 허용)
DROP POLICY IF EXISTS "abm_select" ON public.account_book_member;
CREATE POLICY "abm_select" ON public.account_book_member
  FOR SELECT
  USING (
    account_book_id IN (
      SELECT account_book_id
      FROM public.account_book_member
      WHERE user_id = get_my_user_seq()
    )
  );

DROP POLICY IF EXISTS "abm_insert" ON public.account_book_member;
CREATE POLICY "abm_insert" ON public.account_book_member
  FOR INSERT
  WITH CHECK (
    account_book_id IN (
      SELECT account_book_id
      FROM public.account_book_member
      WHERE user_id = get_my_user_seq()
    )
  );

DROP POLICY IF EXISTS "abm_update" ON public.account_book_member;
CREATE POLICY "abm_update" ON public.account_book_member
  FOR UPDATE
  USING (
    account_book_id IN (
      SELECT account_book_id
      FROM public.account_book_member
      WHERE user_id = get_my_user_seq()
        AND authority = 'OWNER'
    )
  );

DROP POLICY IF EXISTS "abm_delete" ON public.account_book_member;
CREATE POLICY "abm_delete" ON public.account_book_member
  FOR DELETE
  USING (
    account_book_id IN (
      SELECT account_book_id
      FROM public.account_book_member
      WHERE user_id = get_my_user_seq()
        AND authority = 'OWNER'
    )
  );

-- ── transaction ───────────────────────────────────────────────
DROP POLICY IF EXISTS "transaction_own" ON public.transaction;
CREATE POLICY "transaction_own" ON public.transaction
  FOR ALL
  USING (user_seq = get_my_user_seq())
  WITH CHECK (user_seq = get_my_user_seq());

-- ── budget ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "budget_own" ON public.budget;
CREATE POLICY "budget_own" ON public.budget
  FOR ALL
  USING (user_seq = get_my_user_seq())
  WITH CHECK (user_seq = get_my_user_seq());

-- ── recurring_transaction ─────────────────────────────────────
DROP POLICY IF EXISTS "recurring_own" ON public.recurring_transaction;
CREATE POLICY "recurring_own" ON public.recurring_transaction
  FOR ALL
  USING (user_seq = get_my_user_seq())
  WITH CHECK (user_seq = get_my_user_seq());

-- ── category ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "category_own" ON public.category;
CREATE POLICY "category_own" ON public.category
  FOR ALL
  USING (user_seq = get_my_user_seq())
  WITH CHECK (user_seq = get_my_user_seq());

-- ── classification ────────────────────────────────────────────
DROP POLICY IF EXISTS "classification_abm" ON public.classification;
CREATE POLICY "classification_abm" ON public.classification
  FOR ALL
  USING (
    account_book_seq IN (
      SELECT account_book_id
      FROM public.account_book_member
      WHERE user_id = get_my_user_seq()
    )
  );

-- ============================================================
-- 완료! 이제 anon/authenticated 키로 RLS가 적용됩니다.
-- ============================================================
