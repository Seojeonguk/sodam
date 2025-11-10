import {Box, Button, Container, Typography} from "@mui/material";
import {AddCircle} from "@mui/icons-material";
import {useState} from "react";
import CategoryCreateModal from "./components/CategoryCreateModal.tsx";

function CategoryPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  
  const handleOpenCreateCategoryModal = () => {
    setIsCreateModalOpen(true);
  }
  
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  }
  
  return (
    <Container>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          📊 카테고리 관리
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddCircle />}
          onClick={handleOpenCreateCategoryModal}
        >
          새 카테고리 추가
        </Button>
      </Box>
      
      <CategoryCreateModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      />
    </Container>
  )
}

export default CategoryPage;
