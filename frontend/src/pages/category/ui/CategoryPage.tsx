import { useMemo, useState } from "react";
import { AddCircle } from "@mui/icons-material";
import {
  alpha,
  useTheme,
} from "@mui/material/styles";
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
import { useCategories } from "../../../entities/category/model/useCategories";
import { useClassifications } from "../../../entities/category/model/useClassifications";
import CategoryList from "../../../entities/category/ui/CategoryList";
import type { CategoryListItemResponse } from "../../../entities/transaction/api/category.types";
import CategoryCreateModal from "../../../features/category/ui/CategoryCreateModal";
import CategoryEditModal from "../../../features/category/ui/CategoryEditModal";
import CategoryReplaceModal from "../../../features/category/ui/CategoryReplaceModal";

type ManagementTab = "categories" | "classifications";

const classificationLabelMap: Record<"INCOME" | "EXPENSE", string> = {
  INCOME: "수입",
  EXPENSE: "지출",
};

function CategoryPage() {
  const theme = useTheme();
  const { currentAccountBook } = useAccountBookContext();
  const [activeTab, setActiveTab] = useState<ManagementTab>("categories");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryListItemResponse | null>(null);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState(false);
  const [deleteTargetCategoryId, setDeleteTargetCategoryId] = useState<
    number | null
  >(null);

  const { categories, loading, error, refetchCategories, deleteCategory } =
    useCategories();
  const {
    classifications,
    loading: classificationsLoading,
    error: classificationsError,
    refetchClassifications,
  } = useClassifications(currentAccountBook?.id);

  const totalCategories = categories?.categories?.length ?? 0;
  const totalClassifications = classifications.length;
  const hasAnyCategory = totalCategories > 0;

  const showcaseCategories = useMemo(
    () => (categories?.categories ?? []).slice(0, 4),
    [categories],
  );

  const palettePreview = useMemo(() => {
    const allColors = (categories?.categories ?? [])
      .map((category) => category.color)
      .filter((color): color is string => Boolean(color));
    return Array.from(new Set(allColors)).slice(0, 5);
  }, [categories]);

  const quickTips = [
    {
      title: "색으로 묶기",
      description:
        "비슷한 성격의 카테고리에 같은 계열 색을 쓰면 거래 목록을 훨씬 빨리 읽을 수 있습니다.",
    },
    {
      title: "설명은 짧고 선명하게",
      description:
        "카테고리 설명은 한두 문장만 남겨도 가계부를 함께 쓰는 사람이 의도를 이해하기 쉽습니다.",
    },
  ];

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedCategory(null);
  };

  const handleDeleteCategory = (id: number) => {
    setDeleteTargetCategoryId(id);
    setIsReplaceModalOpen(true);
  };

  const handleCloseReplaceModal = () => {
    setIsReplaceModalOpen(false);
    setDeleteTargetCategoryId(null);
  };

  const isCategoryTab = activeTab === "categories";
  const activeCount = isCategoryTab ? totalCategories : totalClassifications;
  const heroTitle = isCategoryTab
    ? "카테고리를 가계부 문맥에 맞게 정리해보세요"
    : "분류는 가계부 전체가 같은 기준을 공유하도록 관리합니다";
  const heroDescription = isCategoryTab
    ? "식비, 교통, 쇼핑처럼 실제 거래를 담는 카테고리를 정리하면 기록과 통계가 훨씬 선명해집니다."
    : "수입과 지출 같은 분류는 개인 설정이 아니라 가계부 공통 규칙입니다. 같은 가계부를 쓰는 모두가 같은 분류 체계를 보게 됩니다.";

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderRadius: 4,
          position: "relative",
          overflow: "hidden",
          color: "common.white",
          backgroundImage: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.95,
          )} 0%, ${alpha(theme.palette.primary.dark, 0.92)} 45%, ${alpha(
            theme.palette.secondary.main,
            0.9,
          )} 100%)`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 320,
            height: 320,
            top: -100,
            right: -120,
            borderRadius: "50%",
            backgroundColor: alpha("#ffffff", 0.15),
            filter: "blur(10px)",
          }}
        />

        <Stack spacing={3} position="relative">
          <Box>
            <Typography variant="overline" sx={{ letterSpacing: 2 }}>
              ACCOUNT BOOK SETTINGS
            </Typography>
            <Typography variant="h4" component="h1" fontWeight={700} mb={1}>
              {heroTitle}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.92, maxWidth: 700 }}>
              {heroDescription}
            </Typography>
          </Box>

          <Tabs
            value={activeTab}
            onChange={(_, value: ManagementTab) => setActiveTab(value)}
            textColor="inherit"
            indicatorColor="secondary"
            sx={{
              bgcolor: alpha("#ffffff", 0.12),
              borderRadius: 999,
              p: 0.5,
              minHeight: 0,
              "& .MuiTabs-indicator": {
                height: "100%",
                borderRadius: 999,
                backgroundColor: alpha("#ffffff", 0.18),
                zIndex: 0,
              },
            }}
          >
            <Tab
              value="categories"
              label="카테고리"
              sx={{ color: "common.white", zIndex: 1, fontWeight: 700 }}
            />
            <Tab
              value="classifications"
              label="분류"
              sx={{ color: "common.white", zIndex: 1, fontWeight: 700 }}
            />
          </Tabs>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h3" component="span" fontWeight={700}>
                {activeCount}
              </Typography>
              <Box>
                <Typography variant="subtitle2">
                  {isCategoryTab ? "총 카테고리" : "총 분류"}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  {currentAccountBook
                    ? `${currentAccountBook.name} 기준`
                    : "가계부를 선택해 주세요"}
                </Typography>
              </Box>
            </Stack>

            <Box flexGrow={1} />

            {isCategoryTab ? (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<AddCircle />}
                onClick={() => setIsCreateModalOpen(true)}
                sx={{
                  fontWeight: 700,
                  px: 3,
                  boxShadow: "none",
                  "&:hover": {
                    boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                  },
                }}
              >
                새 카테고리 추가
              </Button>
            ) : (
              <Chip
                label="분류는 가계부 단위로 공유됩니다"
                sx={{
                  bgcolor: alpha("#ffffff", 0.18),
                  color: "common.white",
                  fontWeight: 700,
                }}
              />
            )}
          </Stack>

          {isCategoryTab && hasAnyCategory && (
            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
              {showcaseCategories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  size="small"
                  sx={{
                    backgroundColor: category.color
                      ? alpha(category.color, 0.9)
                      : alpha("#ffffff", 0.2),
                    color: category.color ? "#fff" : "common.white",
                    borderRadius: "16px",
                    fontWeight: 600,
                  }}
                />
              ))}
            </Stack>
          )}

          {!isCategoryTab && totalClassifications > 0 && (
            <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1}>
              {classifications.map((classification) => (
                <Chip
                  key={classification.id}
                  label={classificationLabelMap[classification.name]}
                  size="small"
                  sx={{
                    backgroundColor: alpha("#ffffff", 0.18),
                    color: "common.white",
                    borderRadius: "16px",
                    fontWeight: 700,
                  }}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </Paper>

      {isCategoryTab && loading && (
        <Stack spacing={3}>
          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }}
            gap={3}
          >
            {[0, 1, 2].map((index) => (
              <Paper sx={{ p: 3, borderRadius: 3 }} key={`category-skeleton-${index}`}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" />
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={80}
                  sx={{ mt: 2, borderRadius: 2 }}
                />
              </Paper>
            ))}
          </Box>
        </Stack>
      )}

      {activeTab === "classifications" && classificationsLoading && (
        <Stack spacing={3}>
          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }}
            gap={3}
          >
            {[0, 1].map((index) => (
              <Paper sx={{ p: 3, borderRadius: 3 }} key={`classification-skeleton-${index}`}>
                <Skeleton variant="text" width="45%" />
                <Skeleton variant="text" width="70%" />
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={64}
                  sx={{ mt: 2, borderRadius: 2 }}
                />
              </Paper>
            ))}
          </Box>
        </Stack>
      )}

      {isCategoryTab && error && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            textAlign: "center",
            border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            카테고리를 불러오지 못했습니다
          </Typography>
          <Typography color="text.secondary">{error}</Typography>
          <Button
            onClick={() => {
              void refetchCategories();
            }}
            sx={{ mt: 3 }}
            variant="contained"
            color="error"
          >
            다시 시도
          </Button>
        </Paper>
      )}

      {activeTab === "classifications" && classificationsError && (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 4,
            textAlign: "center",
            border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            분류를 불러오지 못했습니다
          </Typography>
          <Typography color="text.secondary">{classificationsError}</Typography>
          <Button
            onClick={() => {
              void refetchClassifications();
            }}
            sx={{ mt: 3 }}
            variant="contained"
            color="error"
          >
            다시 시도
          </Button>
        </Paper>
      )}

      {!loading && !error && isCategoryTab && (
        <Stack spacing={3}>
          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }}
            gap={3}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                height: "100%",
              }}
            >
              <Typography variant="overline" color="primary">
                Overview
              </Typography>
              <Typography variant="h5" fontWeight={700} mb={1}>
                {totalCategories}개
              </Typography>
              <Typography color="text.secondary" mb={2}>
                현재 가계부에서 관리 중인 카테고리 수입니다. 거래를 더 세밀하게 나누고 싶다면 여기서 추가해 주세요.
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                height: "100%",
              }}
            >
              <Typography variant="overline" color="secondary">
                Quick Tips
              </Typography>
              <Stack spacing={1.5} mt={1}>
                {quickTips.map((tip) => (
                  <Box key={tip.title}>
                    <Typography fontWeight={600}>{tip.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tip.description}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                height: "100%",
              }}
            >
              <Typography variant="overline" color="info.main">
                Color Palette
              </Typography>
              {palettePreview.length > 0 ? (
                <Stack direction="row" spacing={1.5} mt={2}>
                  {palettePreview.map((color) => (
                    <Box
                      key={color}
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        backgroundColor: color,
                        border: "2px solid #fff",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      }}
                    />
                  ))}
                </Stack>
              ) : (
                <Typography mt={2} color="text.secondary">
                  아직 색상이 지정된 카테고리가 없습니다.
                </Typography>
              )}
            </Paper>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="h5" component="h2" fontWeight={700} mb={2}>
              카테고리 목록
            </Typography>
            <CategoryList
              categories={categories?.categories ?? []}
              onDelete={(id) => {
                handleDeleteCategory(id);
              }}
              onEdit={(category) => {
                setSelectedCategory(category);
                setIsEditModalOpen(true);
              }}
            />
          </Paper>
        </Stack>
      )}

      {!classificationsLoading && !classificationsError && activeTab === "classifications" && (
        <Stack spacing={3}>
          <Box
            display="grid"
            gridTemplateColumns={{ xs: "1fr", md: "repeat(2, 1fr)" }}
            gap={3}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              }}
            >
              <Typography variant="overline" color="primary">
                Shared Rule
              </Typography>
              <Typography variant="h5" fontWeight={700} mb={1}>
                {totalClassifications}개
              </Typography>
              <Typography color="text.secondary">
                분류는 가계부 전체가 함께 쓰는 기준입니다. 개인마다 다르게 보이지 않도록 가계부 기준으로 관리합니다.
              </Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
              }}
            >
              <Typography variant="overline" color="secondary">
                Current Book
              </Typography>
              <Typography variant="h6" fontWeight={700} mb={1}>
                {currentAccountBook?.name ?? "선택된 가계부 없음"}
              </Typography>
              <Typography color="text.secondary">
                분류 목록은 현재 선택된 가계부에 맞춰 바뀝니다. 공유 가계부라면 참여자 모두 같은 분류를 보게 됩니다.
              </Typography>
            </Paper>


          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 4,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="h5" component="h2" fontWeight={700} mb={2}>
              분류 목록
            </Typography>

            {classifications.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  아직 분류가 없습니다
                </Typography>
                <Typography color="text.secondary">
                  기본 분류가 준비되지 않았거나 현재 가계부가 선택되지 않았습니다.
                </Typography>
              </Box>
            ) : (
              <Box
                display="grid"
                gridTemplateColumns={{
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                }}
                gap={2.5}
              >
                {classifications.map((classification) => (
                  <Paper
                    key={classification.id}
                    elevation={0}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                      background:
                        classification.name === "INCOME"
                          ? alpha(theme.palette.success.main, 0.08)
                          : alpha(theme.palette.error.main, 0.08),
                    }}
                  >
                    <Stack spacing={1.5}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Chip
                          label={classificationLabelMap[classification.name]}
                          sx={{ fontWeight: 700 }}
                          color={
                            classification.name === "INCOME"
                              ? "success"
                              : "error"
                          }
                        />
                        <Typography variant="caption" color="text.secondary">
                          ID #{classification.id}
                        </Typography>
                      </Stack>
                      <Typography variant="body1" fontWeight={600}>
                        코드: {classification.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        이 분류 아래에 연결된 카테고리들이 같은 기준으로 거래를 나누게 됩니다.
                      </Typography>
                    </Stack>
                  </Paper>
                ))}
              </Box>
            )}
          </Paper>
        </Stack>
      )}

      <CategoryCreateModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSuccess={refetchCategories}
      />

      <CategoryEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        category={selectedCategory}
        onSuccess={refetchCategories}
      />

      <CategoryReplaceModal
        isOpen={isReplaceModalOpen}
        onClose={handleCloseReplaceModal}
        categories={
          categories?.categories?.filter((c) => c.id !== deleteTargetCategoryId) ??
          []
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
