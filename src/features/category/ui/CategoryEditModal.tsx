import React, { useState, useEffect } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  ClickAwayListener,
  Modal,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { ChromePicker } from "react-color";
import categoryApi from "../../../entities/category/api/categoryApi";
import { useClassifications } from "../../../entities/category/model/useClassifications";
import { FALLBACK_CLASSIFICATIONS, TYPE_LABEL, TYPE_SOLID_STYLE } from "../../../entities/category/lib/classificationUtils";
import { getServerErrorMessage } from "../../../shared/lib/serverState";
import type { CategoryListItemResponse } from "../../../entities/transaction/api/category.types";

const style = {
  position: "fixed" as const,
  // 모바일: 하단 고정, 데스크톱: 중앙
  bottom: { xs: 0, sm: "50%" },
  left: { xs: 0, sm: "50%" },
  right: { xs: 0, sm: "auto" },
  transform: { xs: "none", sm: "translate(-50%, 50%)" },
  width: { xs: "100%", sm: 400 },
  maxWidth: { xs: "100%", sm: "calc(100vw - 32px)" },
  maxHeight: { xs: "92vh", sm: "calc(100vh - 64px)" },
  overflowY: "auto" as const,
  bgcolor: "background.paper",
  border: "none",
  boxShadow: "0 24px 64px rgba(15,23,42,0.18)",
  p: { xs: 3, sm: 4 },
  borderRadius: { xs: "20px 20px 0 0", sm: "24px" },
};

interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryListItemResponse | null;
  onSuccess: () => Promise<void>;
}

const CategoryEditModal: React.FC<CategoryEditModalProps> = ({
  isOpen,
  onClose,
  category,
  onSuccess,
}) => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [color, setColor] = useState<string>("#1976d2");
  const [categoryType, setCategoryType] = useState<string>("EXPENSE");
  const { classifications } = useClassifications();
  const [displayColorPicker, setDisplayColorPicker] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name ?? "");
      setDescription(category.description ?? "");
      setColor(category.color ?? "#1976d2");
      setCategoryType(category.type ?? "EXPENSE");
    }
  }, [category]);

  const handleClose = () => {
    setDisplayColorPicker(false);
    setLoading(false);
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await categoryApi.updateCategory(category.id, {
        name,
        description: description || undefined,
        color: color || undefined,
        type: categoryType,
      });
      await onSuccess();
      setSuccess("카테고리가 성공적으로 수정되었습니다.");
      handleClose();
    } catch (err) {
      setError(getServerErrorMessage(err, "카테고리 수정 중 예상치 못한 오류가 발생했습니다."));
    } finally {
      setLoading(false);
    }
  };

  if (!category) return null;

  return (
    <Modal open={isOpen} onClose={handleClose} aria-labelledby="category-edit-modal-title">
      <Box sx={style} component="form" onSubmit={(e) => void handleSubmit(e)}>
        <Typography id="category-edit-modal-title" variant="h5" component="h2" mb={3}>
          카테고리 수정
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* 수입 / 지출 구분 */}
        <Box mb={2.5}>
          <Typography variant="body2" color="text.secondary" mb={1} fontWeight={600}>
            분류
          </Typography>
          <ToggleButtonGroup
            exclusive
            value={categoryType}
            onChange={(_, value: string | null) => { if (value) setCategoryType(value); }}
            size="small"
            fullWidth
          >
            {(classifications.length > 0 ? classifications : FALLBACK_CLASSIFICATIONS).map((cls) => (
              <ToggleButton key={cls.name} value={cls.name} sx={{ fontWeight: 700, ...TYPE_SOLID_STYLE(cls.name) }}>
                {TYPE_LABEL[cls.name] ?? cls.name}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <TextField
          fullWidth label="이름" value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal" required sx={{ mb: 2 }}
        />

        <TextField
          fullWidth label="설명" value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal" sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth label="색상" value={color}
            onChange={(e) => setColor(e.target.value)}
            margin="normal"
            onClick={() => setDisplayColorPicker(true)}
            InputProps={{ readOnly: true }}
          />
          <Box
            sx={{ width: 40, height: 40, bgcolor: color, border: "1px solid #ccc", borderRadius: 1, mt: 1, cursor: "pointer" }}
            onClick={() => setDisplayColorPicker(true)}
          />
        </Box>

        {displayColorPicker && (
          <ClickAwayListener onClickAway={() => setDisplayColorPicker(false)}>
            <Box sx={{ zIndex: 2, width: "fit-content", marginBottom: 5 }}>
              <ChromePicker color={color} onChange={(c) => setColor(c.hex)} />
            </Box>
          </ClickAwayListener>
        )}

        <Box display="flex" justifyContent="space-between" gap={2}>
          <Button variant="contained" color="error" onClick={handleClose} sx={{ flexGrow: 1 }} disabled={loading}>
            취소
          </Button>
          <Button
            variant="contained" type="submit" sx={{ flexGrow: 1 }} disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "수정 중..." : "카테고리 수정"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default CategoryEditModal;
