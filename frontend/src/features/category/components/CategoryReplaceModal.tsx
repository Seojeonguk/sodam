import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
} from "@mui/material";
import type { CategoryListItemResponse } from "../../transaction/services/category.types";

interface CategoryReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryListItemResponse[];
  onConfirm: (replacementId: number) => void;
}

const CategoryReplaceModal: React.FC<CategoryReplaceModalProps> = ({
  isOpen,
  onClose,
  categories,
  onConfirm,
}) => {
  const [selectedId, setSelectedId] = useState<number | "">("");

  const handleConfirm = () => {
    if (selectedId) {
      onConfirm(Number(selectedId));
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>거래내역 이동 및 카테고리 삭제</DialogTitle>
      <DialogContent>
        <Typography mb={2}>
          이 카테고리에 속한 거래내역을 아래 카테고리로 이동한 후 삭제합니다.
        </Typography>
        <FormControl fullWidth variant="outlined">
          <InputLabel id="replace-category-select-label">
            이동할 카테고리
          </InputLabel>
          <Select
            labelId="replace-category-select-label"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            label="이동할 카테고리"
          >
            {categories.map((cat) => (
              <MenuItem value={cat.id} key={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          취소
        </Button>
        <Button
          onClick={handleConfirm}
          color="primary"
          disabled={!selectedId}
          variant="contained"
        >
          삭제 및 이동
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryReplaceModal;
