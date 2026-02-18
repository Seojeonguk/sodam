import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  ClickAwayListener,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import { ChromePicker } from "react-color";
import categoryApi from "../services/categoryApi";
import axios, { type AxiosError } from "axios";

// 랜덤 색상 생성 유틸리티
const getRandomColor = () => {
  return "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
};

// 모달 스타일 (Material-UI 기본 Box 컴포넌트 사용)
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  borderRadius: "8px",
} as const;

// CategoryCreateModal 컴포넌트가 받을 props 정의
interface CategoryCreateModalProps {
  isOpen: boolean;
  onClose: () => void; // 모달이 닫힐 때 호출될 콜백 (부모에서 데이터 새로고침 등을 할 수 있음)
}

const CategoryCreateModal: React.FC<CategoryCreateModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [color, setColor] = useState<string>(getRandomColor());
  const [displayColorPicker, setDisplayColorPicker] = useState<boolean>(false);

  // API 호출 상태 관리
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleClose = () => {
    setName("");
    setDescription("");
    setColor(getRandomColor());
    setDisplayColorPicker(false);
    setLoading(false);
    setError(null);
    setSuccess(null);
    onClose(); // 부모 컴포넌트의 onClose 호출
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await categoryApi.createCategory({
        name,
        description: description || undefined,
        color: color || undefined,
      });
      setSuccess("카테고리가 성공적으로 추가되었습니다.");
      handleClose();
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      if (axios.isAxiosError(axiosError) && axiosError.response) {
        setError(
          `카테고리 추가 실패: ${axiosError.response.data?.message ?? axiosError.message}`,
        );
      } else {
        setError("카테고리 추가 중 예상치 못한 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleColor = (color: { hex: string }) => {
    setColor(color.hex);
    console.log(color.hex);
  };

  const handleOpenColorPicker = () => {
    setDisplayColorPicker(true);
  };

  const handleCloseColorPicker = () => {
    setDisplayColorPicker(false);
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="transaction-create-modal-title"
      aria-describedby="transaction-create-modal-description"
    >
      <Box sx={style} component="form" onSubmit={(e) => void handleSubmit(e)}>
        <Typography
          id="transaction-create-modal-title"
          variant="h5"
          component="h2"
          mb={3}
        >
          새 카테고리 추가
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <TextField
          fullWidth
          label="이름"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="설명"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          sx={{ mb: 2 }}
        />

        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="색상"
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            margin="normal"
            onClick={handleOpenColorPicker}
            InputProps={{
              readOnly: true,
            }}
          />
          <Box
            sx={{
              width: 40,
              height: 40,
              bgcolor: color,
              border: "1px solid #ccc",
              borderRadius: 1,
              mt: 1,
              cursor: "pointer",
            }}
            onClick={handleOpenColorPicker}
          />
        </Box>

        {displayColorPicker && (
          <ClickAwayListener onClickAway={() => handleCloseColorPicker()}>
            <Box sx={{ zIndex: 2, width: "fit-content", marginBottom: 5 }}>
              <ChromePicker color={color} onChange={handleColor} />
            </Box>
          </ClickAwayListener>
        )}

        <Box display="flex" justifyContent="space-between" gap={2}>
          <Button
            variant="contained"
            color="error"
            onClick={handleClose}
            sx={{ flexGrow: 1 }}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            variant="contained"
            type="submit"
            sx={{ flexGrow: 1 }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "추가 중..." : "카테고리 추가"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default CategoryCreateModal;
