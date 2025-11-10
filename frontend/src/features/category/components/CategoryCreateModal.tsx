import React, {useState} from "react";
import {Alert, Box, Button, CircularProgress, Modal, TextField, Typography,} from "@mui/material";

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

// TransactionCreateModal 컴포넌트가 받을 props 정의
interface TransactionCreateModalProps {
  isOpen: boolean;
  onClose: () => void; // 모달이 닫힐 때 호출될 콜백 (부모에서 데이터 새로고침 등을 할 수 있음)
}

const CategoryCreateModal: React.FC<TransactionCreateModalProps> = ({
                                                                      isOpen,
                                                                      onClose,
                                                                    }) => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [color, setColor] = useState<string>("");

  // API 호출 상태 관리
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleClose = () => {
    setName("");
    setLoading(false);
    setError(null);
    setSuccess(null);
    onClose(); // 부모 컴포넌트의 onClose 호출
  };

  const handleSubmit =  (e: React.FormEvent) => {
    e.preventDefault();
  }

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
          <Alert severity="error" sx={{mb: 2}}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{mb: 2}}>
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
          sx={{mb: 2}}
        />

        <TextField
          fullWidth
          label="설명"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          sx={{mb: 2}}
        />

        <TextField
          fullWidth
          label="색상"
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          margin="normal"
          sx={{mb: 2}}
        />


        <Box display="flex" justifyContent="space-between" gap={2}>
          <Button
            variant="contained"
            color="error"
            onClick={handleClose}
            sx={{flexGrow: 1}}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            variant="contained"
            type="submit"
            sx={{flexGrow: 1}}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20}/> : null}
          >
            {loading ? "추가 중..." : "카테고리 추가"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default CategoryCreateModal;
