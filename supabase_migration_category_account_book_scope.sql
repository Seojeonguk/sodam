-- ============================================================
-- Sodam - category 테이블 가계부 단위 공유 전환 마이그레이션
--
-- 배경: category가 그동안 user_seq(작성자) 기준으로만 동작해, 가계부에
-- 초대된 멤버가 다른 멤버의 카테고리를 보거나 쓸 수 없었음. transaction/
-- budget/recurring_transaction과 동일하게 account_book_seq 기준 공유로
-- 전환한다.
--
-- 기존 Supabase 프로젝트(이미 데이터가 있는 DB)에 한 번만 실행하면 됨.
-- 여러 번 실행해도 안전하도록 작성됨(컬럼/값이 이미 있으면 건너뜀).
-- Supabase 대시보드 > SQL Editor
-- ============================================================

-- 1) 컬럼 추가 (이미 있으면 건너뜀)
ALTER TABLE public.category ADD COLUMN IF NOT EXISTS account_book_seq BIGINT;

-- 2) 백필 1단계: user_seq가 OWNER로 속한 가계부 중 가장 먼저 생성된 가계부
UPDATE public.category c
SET account_book_seq = sub.account_book_id
FROM (
  SELECT DISTINCT ON (abm.user_id) abm.user_id, abm.account_book_id
  FROM public.account_book_member abm
  WHERE abm.authority = 'OWNER'
  ORDER BY abm.user_id, abm.created_at ASC, abm.account_book_id ASC
) sub
WHERE c.user_seq = sub.user_id
  AND c.account_book_seq IS NULL;

-- 3) 백필 2단계: 1단계에서 못 채운 행 — user_seq가 속한 아무 가계부 중 가장 먼저 생성된 것
--    (본인이 OWNER인 가계부를 모두 삭제한 것 같은 예외 케이스 대비)
UPDATE public.category c
SET account_book_seq = sub.account_book_id
FROM (
  SELECT DISTINCT ON (abm.user_id) abm.user_id, abm.account_book_id
  FROM public.account_book_member abm
  ORDER BY abm.user_id, abm.created_at ASC, abm.account_book_id ASC
) sub
WHERE c.user_seq = sub.user_id
  AND c.account_book_seq IS NULL;

-- 4) 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_category_account_book_seq ON public.category(account_book_seq);

-- 5) 백필 결과 확인 후, NULL이 하나도 없을 때만 NOT NULL 제약 적용
--    (남아있는 NULL은 소속 가계부가 전혀 없는 사용자의 카테고리 — 이번 마이그레이션에서
--    강제로 채우지 않고, RLS상 아무에게도 보이지 않는 채로 남겨둔다)
DO $$
DECLARE
  v_null_count INT;
BEGIN
  SELECT COUNT(*) INTO v_null_count FROM public.category WHERE account_book_seq IS NULL;

  IF v_null_count = 0 THEN
    ALTER TABLE public.category ALTER COLUMN account_book_seq SET NOT NULL;
  ELSE
    RAISE NOTICE 'category.account_book_seq가 NULL인 행이 %건 남아있어 NOT NULL 제약을 건너뜁니다.', v_null_count;
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 완료! 다음 단계: supabase_rls.sql 재실행 (category_select/category_write 정책 반영)
-- ══════════════════════════════════════════════════════════════
