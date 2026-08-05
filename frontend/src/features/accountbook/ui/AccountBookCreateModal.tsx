import { useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import accountBookApi from "../../../entities/accountbook/api/accountBookApi";

interface AccountBookCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export default function AccountBookCreateModal({
  open,
  onClose,
  onSuccess,
}: AccountBookCreateModalProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setName("");
    setError(null);
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("가계부 이름을 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await accountBookApi.createAccountBook(name.trim());
      await onSuccess();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "가계부 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        component: "form",
        onSubmit: (e: React.FormEvent) => void handleSubmit(e),
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>새 가계부 만들기</DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <TextField
          autoFocus
          fullWidth
          label="가계부 이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 우리 가족 가계부"
          inputProps={{ maxLength: 50 }}
          sx={{ mt: 0.5 }}
        />
        {error && (
          <Alert severity="error" sx={{ mt: 1.5 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          취소
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !name.trim()}
          sx={{ fontWeight: 700, minWidth: 80 }}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : "만들기"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
