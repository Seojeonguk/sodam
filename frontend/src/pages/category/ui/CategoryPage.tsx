import { useEffect, useMemo, useState } from "react";
import { AddCircle } from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";
import { supabase } from "../../../shared/lib/supabase";
import { useCategories } from "../../../entities/category/model/useCategories";
import { useClassifications } from "../../../entities/category/model/useClassifications";
import CategoryList from "../../../entities/category/ui/CategoryList";
import type { CategoryListItemResponse } from "../../../entities/transaction/api/category.types";
import CategoryCreateModal from "../../../features/category/ui/CategoryCreateModal";
import CategoryEditModal from "../../../features/category/ui/CategoryEditModal";
import CategoryReplaceModal from "../../../features/category/ui/CategoryReplaceModal";
import CategoryTransactionsModal from "../../../features/category/ui/CategoryTransactionsModal";

type ManagementTab = "categories" | "classifications";

import { TYPE_LABEL, TYPE_MUI_COLOR } from "../../../entities/category/lib/classificationUtils";

function CategoryPage() {
  const theme = useTheme();
  const { currentAccountBook } = useAccountBookContext();
  const [activeTab, setActiveTab] = useState<ManagementTab>("categories");
  const [categoryTypeFilter, setCategoryTypeFilter] = useState<string>("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryListItemResponse | null>(null);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [deleteTargetCategoryId, setDeleteTargetCategoryId] = useState<number | null>(null);
  const [txModalCategory, setTxModalCategory] = useState<CategoryListItemResponse | null>(null);

  const { categories, loading, error, refetchCategories, deleteCategory } = useCategories();

  // 카테고리별 거래 건수
  // — head:true 로 데이터 전송 없이 COUNT만 받아옴 (행 수 제한 우회)
  const [catCountMap, setCatCountMap] = useState<Map<number, number>>(new Map());
  useEffect(() => {
    if (!currentAccountBook || !categories || categories.length === 0) return;
    void (async () => {
      const { getUserSeq } = await import("../../../shared/lib/userSync");
      const userSeq = await getUserSeq();
      const entries = await Promise.all(
        categories.map(async (cat) => {
          const { count } = await supabase
            .from("transaction")
            .select("*", { count: "exact", head: true })
            .eq("account_book_seq", currentAccountBook.id)
            .eq("user_seq", userSeq)
            .eq("category_seq", cat.id);
          return [cat.id, count ?? 0] as [number, number];
        }),
      );
      setCatCountMap(new Map(entries));
    })();
  }, [currentAccountBook, categories]);
  const {
    classifications,
    loading: classificationsLoading,
    error: classificationsError,
    refetchClassifications,
  } = useClassifications(currentAccountBook?.id);

  const allCategoryList = categories ?? [];
  const filteredCategories = useMemo(
    () =>
      categoryTypeFilter === "ALL"
        ? allCategoryList
        : allCategoryList.filter((c) => c.type === categoryTypeFilter),
    [allCategoryList, categoryTypeFilter],
  );

  const isCategoryTab = activeTab === "categories";

  const handleDeleteCategory = (id: number) => {
    // 거래가 없으면 바로 삭제, 있으면 이동 대상 카테고리 선택
    if ((catCountMap.get(id) ?? 0) === 0) {
      void (async () => {
        try {
          await deleteCategory(id, 0);
        } catch (err) {
          alert(`카테고리 삭제 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`);
        }
      })();
      return;
    }
    setDeleteTargetCategoryId(id);
    setIsReplaceModalOpen(true);
  };

  const handleCloseReplaceModal = () => {
    setIsReplaceModalOpen(false);
    setDeleteTargetCategoryId(null);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>

      {/* ── 페이지 헤더 ── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        mb={1}
        gap={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            카테고리 관리
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentAccountBook
              ? `${currentAccountBook.name} 기준`
              : "가계부를 선택해 주세요"}{" "}
            · 카테고리 {allCategoryList.length}개
          </Typography>
        </Box>

        {isCategoryTab && (
          <Button
            variant="contained"
            startIcon={<AddCircle />}
            onClick={() => setIsCreateModalOpen(true)}
            sx={{ fontWeight: 700, textTransform: "none", flexShrink: 0 }}
          >
            새 카테고리
          </Button>
        )}
      </Stack>

      {/* ── 탭 내비게이션 ── */}
      <Box sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value: ManagementTab) => setActiveTab(value)}
        >
          <Tab value="categories" label="카테고리" />
          <Tab value="classifications" label="분류" />
        </Tabs>
      </Box>

      {/* ══ 카테고리 탭 ══ */}
      {isCategoryTab && loading && (
        <Box
          display="grid"
          gridTemplateColumns={{ xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }}
          gap={2.5}
        >
          {[0, 1, 2].map((i) => (
            <Paper key={i} sx={{ p: 3, borderRadius: 2 }}>
              <Skeleton variant="text" width="60%" />
              <Skeleton variant="text" width="40%" />
              <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 2, borderRadius: 1 }} />
            </Paper>
          ))}
        </Box>
      )}

      {isCategoryTab && error && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: "center",
            border: "1px solid",
            borderColor: alpha(theme.palette.error.main, 0.3),
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            카테고리를 불러오지 못했습니다
          </Typography>
          <Typography color="text.secondary">{error}</Typography>
          <Button
            onClick={() => { void refetchCategories(); }}
            sx={{ mt: 3 }}
            variant="contained"
            color="error"
          >
            다시 시도
          </Button>
        </Paper>
      )}

      {!loading && !error && isCategoryTab && (
        <Paper
          elevation={0}
          sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
        >
          {/* 타입 필터 */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
            mb={2.5}
            gap={1}
          >
            <Typography variant="h6" fontWeight={600}>
              카테고리 목록
            </Typography>
            <Tabs
              value={categoryTypeFilter}
              onChange={(_, v: string) => setCategoryTypeFilter(v)}
              sx={{
                minHeight: 36,
                "& .MuiTab-root": { minHeight: 36, py: 0.5, fontSize: "0.8rem" },
              }}
            >
              <Tab value="ALL" label={`전체 (${allCategoryList.length})`} />
              {classifications.map((cls) => (
                <Tab
                  key={cls.name}
                  value={cls.name}
                  label={`${TYPE_LABEL[cls.name] ?? cls.name} (${allCategoryList.filter((c) => c.type === cls.name).length})`}
                  sx={{ color: `${TYPE_MUI_COLOR[cls.name] ?? "default"}.main` }}
                />
              ))}
            </Tabs>
          </Stack>

          <CategoryList
            categories={filteredCategories}
            countMap={catCountMap}
            onDelete={handleDeleteCategory}
            onEdit={(category) => {
              setSelectedCategory(category);
              setIsEditModalOpen(true);
            }}
            onSelect={(category) => setTxModalCategory(category)}
          />
        </Paper>
      )}

      {/* ══ 분류 탭 ══ */}
      {activeTab === "classifications" && classificationsLoading && (
        <Box
          display="grid"
          gridTemplateColumns={{ xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }}
          gap={2.5}
        >
          {[0, 1].map((i) => (
            <Paper key={i} sx={{ p: 3, borderRadius: 2 }}>
              <Skeleton variant="text" width="45%" />
              <Skeleton variant="text" width="70%" />
              <Skeleton variant="rectangular" width="100%" height={48} sx={{ mt: 2, borderRadius: 1 }} />
            </Paper>
          ))}
        </Box>
      )}

      {activeTab === "classifications" && classificationsError && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 2,
            textAlign: "center",
            border: "1px solid",
            borderColor: alpha(theme.palette.error.main, 0.3),
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            분류를 불러오지 못했습니다
          </Typography>
          <Typography color="text.secondary">{classificationsError}</Typography>
          <Button
            onClick={() => { void refetchClassifications(); }}
            sx={{ mt: 3 }}
            variant="contained"
            color="error"
          >
            다시 시도
          </Button>
        </Paper>
      )}

      {!classificationsLoading && !classificationsError && activeTab === "classifications" && (
        <Paper
          elevation={0}
          sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5}>
            <Typography variant="h6" fontWeight={600}>분류 목록</Typography>
            <Chip
              label="가계부 공통 기준"
              size="small"
              variant="outlined"
              color="default"
              sx={{ fontSize: "0.72rem" }}
            />
          </Stack>

          {classifications.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                아직 분류가 없습니다
              </Typography>
              <Typography color="text.secondary">
                현재 가계부가 선택되지 않았거나 기본 분류가 준비되지 않았습니다.
              </Typography>
            </Box>
          ) : (
            <Box
              display="grid"
              gridTemplateColumns={{ xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }}
              gap={2}
            >
              {classifications.map((classification) => (
                <Paper
                  key={classification.id}
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: alpha(theme.palette[TYPE_MUI_COLOR[classification.name] ?? "primary"].main, 0.3),
                    bgcolor:     alpha(theme.palette[TYPE_MUI_COLOR[classification.name] ?? "primary"].main, 0.04),
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Chip
                      label={TYPE_LABEL[classification.name] ?? classification.name}
                      size="small"
                      color={TYPE_MUI_COLOR[classification.name] ?? "default"}
                      sx={{ fontWeight: 700 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      ID #{classification.id}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    이 분류 아래 연결된 카테고리들이 같은 기준으로 거래를 나눕니다.
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}
        </Paper>
      )}

      {/* ── 모달 ── */}
      <CategoryTransactionsModal
        open={txModalCategory !== null}
        onClose={() => setTxModalCategory(null)}
        category={txModalCategory}
        accountBookId={currentAccountBook?.id}
      />
      <CategoryCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={refetchCategories}
      />
      <CategoryEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSuccess={refetchCategories}
      />
      <CategoryReplaceModal
        isOpen={isReplaceModalOpen}
        onClose={handleCloseReplaceModal}
        categories={
          categories?.filter((c) => c.id !== deleteTargetCategoryId) ?? []
        }
        onConfirm={(replacementId: number) => {
          void (async () => {
            if (deleteTargetCategoryId && replacementId) {
              try {
                await deleteCategory(deleteTargetCategoryId, replacementId);
                handleCloseReplaceModal();
              } catch (err) {
                alert(
                  `카테고리 삭제 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`,
                );
              }
            }
          })();
        }}
      />
    </Container>
  );
}

export default CategoryPage;
