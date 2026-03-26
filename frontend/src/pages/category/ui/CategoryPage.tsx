import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Stack,
  Chip,
  Skeleton,
} from "@mui/material";
import { AddCircle } from "@mui/icons-material";
import { useMemo, useState } from "react";
import CategoryCreateModal from "../../../features/category/ui/CategoryCreateModal";
import CategoryEditModal from "../../../features/category/ui/CategoryEditModal";
import CategoryList from "../../../entities/category/ui/CategoryList";
import { useCategories } from "../../../entities/category/model/useCategories";
import type { CategoryListItemResponse } from "../../../entities/transaction/api/category.types";
import { alpha, useTheme } from "@mui/material/styles";
import CategoryReplaceModal from "../../../features/category/ui/CategoryReplaceModal";

function CategoryPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryListItemResponse | null>(null);
  const [isReplaceModalOpen, setIsReplaceModalOpen] = useState<boolean>(false);
  const [deleteTargetCategoryId, setDeleteTargetCategoryId] = useState<
    number | null
  >(null);
  const { categories, loading, error, refetchCategories, deleteCategory } =
    useCategories();
  const theme = useTheme();

  const totalCategories = categories?.categories?.length ?? 0;
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
      title: "시각적 그룹화",
      description: "색상 필드를 활용해 유사한 카테고리를 한눈에 묶어보세요.",
    },
    {
      title: "간결한 설명",
      description: "두 줄 이내의 설명을 써두면 팀원과도 쉽게 공유할 수 있어요.",
    },
  ];

  const handleOpenCreateCategoryModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    void refetchCategories(); // 모달 닫힐 때 목록 갱신
  };

  const handleOpenEditCategoryModal = (category: CategoryListItemResponse) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedCategory(null);
    void refetchCategories(); // 모달 닫힐 때 목록 갱신
  };

  const handleOpenReplaceModal = (categoryId: number) => {
    setDeleteTargetCategoryId(categoryId);
    setIsReplaceModalOpen(true);
  };

  const handleCloseReplaceModal = () => {
    setIsReplaceModalOpen(false);
    setDeleteTargetCategoryId(null);
  };

  // handleDeleteCategory를 모달 오픈 용으로 변경
  const handleDeleteCategory = (id: number) => {
    handleOpenReplaceModal(id);
  };

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
              CATEGORY
            </Typography>
            <Typography variant="h4" component="h1" fontWeight={700} mb={1}>
              📊 카테고리를 세련되게 정돈해보세요
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
              컬러, 설명, 우선순위를 조합해 지출과 수입을 스토리텔링 하듯 기록할
              수 있어요. 필요한 카테고리를 자유롭게 추가하거나 수정해 보세요.
            </Typography>
          </Box>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h3" component="span" fontWeight={700}>
                {totalCategories}
              </Typography>
              <Box>
                <Typography variant="subtitle2">총 카테고리</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  지금 관리 중인 항목
                </Typography>
              </Box>
            </Stack>
            <Box flexGrow={1} />
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AddCircle />}
              onClick={handleOpenCreateCategoryModal}
              sx={{
                fontWeight: 600,
                px: 3,
                boxShadow: "none",
                "&:hover": {
                  boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                },
              }}
            >
              새 카테고리 추가
            </Button>
          </Stack>

          {hasAnyCategory && (
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
        </Stack>
      </Paper>

      {loading && (
        <Stack spacing={3}>
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: "1fr",
              md: "repeat(3, minmax(0, 1fr))",
            }}
            gap={3}
          >
            {[0, 1, 2].map((index) => (
              <Paper sx={{ p: 3, borderRadius: 3 }} key={`skeleton-${index}`}>
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
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
          </Paper>
        </Stack>
      )}

      {error && (
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
            오류가 발생했습니다
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

      {!loading && !error && (
        <Stack spacing={3}>
          <Box
            display="grid"
            gridTemplateColumns={{
              xs: "1fr",
              md: "repeat(3, minmax(0, 1fr))",
            }}
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
                지금까지 등록한 카테고리입니다. 필요한 만큼 자유롭게 추가할 수
                있어요.
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
                  색상이 지정된 카테고리가 아직 없습니다.
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
                void handleDeleteCategory(id);
              }}
              onEdit={handleOpenEditCategoryModal}
            />
          </Paper>
        </Stack>
      )}

      <CategoryCreateModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      />

      <CategoryEditModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        category={selectedCategory}
      />

      <CategoryReplaceModal
        isOpen={isReplaceModalOpen}
        onClose={handleCloseReplaceModal}
        categories={
          categories?.categories?.filter(
            (c) => c.id !== deleteTargetCategoryId,
          ) ?? []
        }
        onConfirm={(replacementId: number) => {
          void (async () => {
            if (deleteTargetCategoryId && replacementId) {
              try {
                await deleteCategory(deleteTargetCategoryId, replacementId);
                handleCloseReplaceModal();
                void refetchCategories();
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
