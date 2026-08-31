-- ============================================================
-- Sodam - account_book_member 중복 행 정리 + UNIQUE 제약 추가
--
-- 배경: getUserSeq()/syncUser()가 동시에 여러 번 호출되면(페이지 로드 시
-- 여러 API가 동시에 사용자 동기화를 트리거하는 경우) 초대 자동 수락
-- 로직(processPendingInvites)이 같은 (account_book_id, user_id) 조합으로
-- account_book_member 행을 중복 생성할 수 있었음. 이로 인해 가계부
-- 목록에 동일한 가계부가 2개씩 보이는 문제가 발생.
--
-- 이 스크립트는 기존에 이미 생성된 중복 행을 정리하고, 앞으로 같은
-- 문제가 재발하지 않도록 UNIQUE 제약을 추가한다.
-- 기존 Supabase 프로젝트(이미 데이터가 있는 DB)에 한 번만 실행하면 됨.
-- Supabase 대시보드 > SQL Editor
-- ============================================================

-- 1) 중복 행 정리: (account_book_id, user_id) 조합별로 가장 먼저 생성된
--    행(id가 가장 작은 행)만 남기고 나머지는 삭제
DELETE FROM public.account_book_member a
USING public.account_book_member b
WHERE a.account_book_id = b.account_book_id
  AND a.user_id         = b.user_id
  AND a.id > b.id;

-- 2) 재발 방지: UNIQUE 제약 추가 (이미 존재하면 건너뜀)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uk_account_book_member'
  ) THEN
    ALTER TABLE public.account_book_member
      ADD CONSTRAINT uk_account_book_member UNIQUE (account_book_id, user_id);
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════
-- 완료!
-- ══════════════════════════════════════════════════════════════
