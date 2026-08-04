-- ============================================================
-- Sodam - RLS 전체 설정 스크립트
-- supabase_setup.sql 실행 후 이 파일을 실행하세요.
-- Supabase 대시보드 > SQL Editor
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- 1. SECURITY DEFINER 헬퍼 함수
--    account_book_member 정책이 자기 자신을 서브쿼리로 참조하면
--    infinite recursion이 발생하므로 SECURITY DEFINER 함수로 우회.
-- ══════════════════════════════════════════════════════════════

-- 현재 Auth 유저의 users.id (BIGSERIAL) 반환
CREATE OR REPLACE FUNCTION public.get_my_user_seq()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE email = auth.email()
$$;

-- 현재 유저가 멤버인 가계부 ID 목록 (RLS 우회)
CREATE OR REPLACE FUNCTION public.get_my_account_book_ids()
RETURNS SETOF BIGINT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT account_book_id
  FROM public.account_book_member
  WHERE user_id = (SELECT id FROM public.users WHERE email = auth.email())
$$;

-- 현재 유저가 OWNER인 가계부 ID 목록 (RLS 우회)
CREATE OR REPLACE FUNCTION public.get_my_owned_account_book_ids()
RETURNS SETOF BIGINT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT account_book_id
  FROM public.account_book_member
  WHERE user_id = (SELECT id FROM public.users WHERE email = auth.email())
    AND authority = 'OWNER'
$$;


-- ══════════════════════════════════════════════════════════════
-- 2. RLS 활성화
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_book          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_book_member   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classification        ENABLE ROW LEVEL SECURITY;


-- ══════════════════════════════════════════════════════════════
-- 3. RLS 정책
-- ══════════════════════════════════════════════════════════════

-- ── users ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_self" ON public.users;
CREATE POLICY "users_self" ON public.users
  FOR ALL
  USING     (email = auth.email())
  WITH CHECK (email = auth.email());


-- ── account_book ─────────────────────────────────────────────
-- INSERT: 신규 book 생성 시점엔 아직 멤버가 없으므로 인증 여부만 확인
-- SELECT/UPDATE: 내가 멤버인 가계부만
-- DELETE: 내가 OWNER인 가계부만

-- 과거 스크립트에서 생성된 모든 이름 제거 (이름 불일치로 인한 중복 차단 방지)
DROP POLICY IF EXISTS "account_book_access"         ON public.account_book;
DROP POLICY IF EXISTS "account_book_member_access"  ON public.account_book;
DROP POLICY IF EXISTS "account_book_insert"         ON public.account_book;
DROP POLICY IF EXISTS "account_book_select"         ON public.account_book;
DROP POLICY IF EXISTS "account_book_update"         ON public.account_book;
DROP POLICY IF EXISTS "account_book_delete"         ON public.account_book;

CREATE POLICY "account_book_insert" ON public.account_book
  FOR INSERT
  WITH CHECK (auth.email() IS NOT NULL);

CREATE POLICY "account_book_select" ON public.account_book
  FOR SELECT
  USING (id IN (SELECT public.get_my_account_book_ids()));

CREATE POLICY "account_book_update" ON public.account_book
  FOR UPDATE
  USING (id IN (SELECT public.get_my_account_book_ids()));

CREATE POLICY "account_book_delete" ON public.account_book
  FOR DELETE
  USING (id IN (SELECT public.get_my_owned_account_book_ids()));


-- ── account_book_member ───────────────────────────────────────
-- SELECT: 내가 속한 가계부의 멤버 목록 조회
-- INSERT: 본인을 OWNER로 최초 등록 OR 이미 멤버인 가계부에 초대
-- UPDATE/DELETE: OWNER만 가능
DROP POLICY IF EXISTS "abm_select" ON public.account_book_member;
DROP POLICY IF EXISTS "abm_insert" ON public.account_book_member;
DROP POLICY IF EXISTS "abm_update" ON public.account_book_member;
DROP POLICY IF EXISTS "abm_delete" ON public.account_book_member;

CREATE POLICY "abm_select" ON public.account_book_member
  FOR SELECT
  USING (account_book_id IN (SELECT public.get_my_account_book_ids()));

CREATE POLICY "abm_insert" ON public.account_book_member
  FOR INSERT
  WITH CHECK (
    user_id = public.get_my_user_seq()
    OR account_book_id IN (SELECT public.get_my_account_book_ids())
  );

CREATE POLICY "abm_update" ON public.account_book_member
  FOR UPDATE
  USING (account_book_id IN (SELECT public.get_my_owned_account_book_ids()));

CREATE POLICY "abm_delete" ON public.account_book_member
  FOR DELETE
  USING (account_book_id IN (SELECT public.get_my_owned_account_book_ids()));


-- ── transaction ───────────────────────────────────────────────
DROP POLICY IF EXISTS "transaction_own" ON public.transaction;
CREATE POLICY "transaction_own" ON public.transaction
  FOR ALL
  USING     (user_seq = public.get_my_user_seq())
  WITH CHECK (user_seq = public.get_my_user_seq());


-- ── budget ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "budget_own" ON public.budget;
CREATE POLICY "budget_own" ON public.budget
  FOR ALL
  USING     (user_seq = public.get_my_user_seq())
  WITH CHECK (user_seq = public.get_my_user_seq());


-- ── recurring_transaction ─────────────────────────────────────
DROP POLICY IF EXISTS "recurring_own" ON public.recurring_transaction;
CREATE POLICY "recurring_own" ON public.recurring_transaction
  FOR ALL
  USING     (user_seq = public.get_my_user_seq())
  WITH CHECK (user_seq = public.get_my_user_seq());


-- ── category ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "category_own" ON public.category;
CREATE POLICY "category_own" ON public.category
  FOR ALL
  USING     (user_seq = public.get_my_user_seq())
  WITH CHECK (user_seq = public.get_my_user_seq());


-- ── classification ────────────────────────────────────────────
DROP POLICY IF EXISTS "classification_abm" ON public.classification;
CREATE POLICY "classification_abm" ON public.classification
  FOR ALL
  USING (account_book_seq IN (SELECT public.get_my_account_book_ids()));


-- ══════════════════════════════════════════════════════════════
-- 완료!
-- ══════════════════════════════════════════════════════════════
