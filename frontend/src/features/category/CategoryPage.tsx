import { Box, Button, Container, Typography, Paper } from "@mui/material";
import { AddCircle } from "@mui/icons-material";
import { useState } from "react";
import CategoryCreateModal from "./components/CategoryCreateModal.tsx";
import CategoryList from "./components/CategoryList.tsx";
import { useCategories } from "./hooks/useCategories.ts";

function CategoryPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const { categories, loading, error, refetchCategories, deleteCategory } =
    useCategories();

  const handleOpenCreateCategoryModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    void refetchCategories(); // 모달 닫힐 때 목록 갱신
  };

  const handleDeleteCategory = async (id: number) => {
    if (window.confirm("정말로 이 카테고리를 삭제하시겠습니까?")) {
      try {
        await deleteCategory(id);
      } catch (err) {
        alert(
          `카테고리 삭제 실패: ${err instanceof Error ? err.message : "알 수 없는 오류"}`
        );
      }
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" mb={3}>
        📊 카테고리 관리
      </Typography>

      {loading && (
        <Paper elevation={2} sx={{ p: 3, mt: 2, textAlign: "center" }}>
          <Typography>데이터를 불러오는 중입니다...</Typography>
        </Paper>
      )}

      {error && (
        <Paper
          elevation={2}
          sx={{ p: 3, mt: 2, textAlign: "center", color: "error.main" }}
        >
          <Typography>오류 발생: {error}</Typography>
          <Button
            onClick={() => {
              void refetchCategories();
            }}
            sx={{ mt: 2 }}
            variant="outlined"
          >
            다시 시도
          </Button>
        </Paper>
      )}

      {!loading && !error && (
        <>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddCircle />}
              onClick={handleOpenCreateCategoryModal}
            >
              새 카테고리 추가
            </Button>
          </Box>

          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" mb={2}>
              카테고리 목록
            </Typography>
            <CategoryList
              categories={categories?.categories ?? []}
              onDelete={(id) => {
                void handleDeleteCategory(id);
              }}
            />
          </Paper>
        </>
      )}

      <CategoryCreateModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      />
    </Container>
  );
}

export default CategoryPage;
