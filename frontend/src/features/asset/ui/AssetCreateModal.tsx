import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { ASSET_TYPE_CONFIG, ASSET_TYPES, type AssetType } from "../../../entities/asset/api/asset.types";
import { getServerErrorMessage } from "../../../shared/lib/serverState";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (req: { name: string; type: AssetType; balance: number; note?: string }) => Promise<void>;
}

const AssetCreateModal: React.FC<Props> = ({ open, onClose, onSubmit }) => {
  const theme = useTheme();
  const [type, setType] = useState<AssetType>("BANK");
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setType("BANK"); setName(""); setBalance(""); setNote(""); setError(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("자산 이름을 입력해 주세요."); return; }
    const parsedBalance = parseInt(balance.replace(/,/g, ""), 10);
    if (isNaN(parsedBalance)) { setError("올바른 금액을 입력해 주세요."); return; }

    setLoading(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), type, balance: parsedBalance, note: note.trim() || undefined });
      handleClose();
    } catch (e) {
      setError(getServerErrorMessage(e, "자산 생성 중 오류가 발생했습니다."));
    } finally {
      setLoading(false);
    }
  };

  const cfg = ASSET_TYPE_CONFIG[type];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, pb: 0 }}>새 자산 추가</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box component="form" onSubmit={(e) => void handleSubmit(e)}>

          {/* 자산 유형 */}
          <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5} display="block">
            자산 유형
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2.5 }}>
            {ASSET_TYPES.map((t) => {
              const c = ASSET_TYPE_CONFIG[t];
              const selected = type === t;
              return (
                <Button
                  key={t}
                  size="small"
                  variant={selected ? "contained" : "outlined"}
                  onClick={() => setType(t)}
                  sx={{
                    borderRadius: 5,
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    bgcolor: selected ? c.color : "transparent",
                    borderColor: c.color,
                    color: selected ? "white" : c.color,
                    "&:hover": { bgcolor: alpha(c.color, selected ? 0.85 : 0.08) },
                  }}
                >
                  {c.label}
                </Button>
              );
            })}
          </Box>

          {/* 자산 이름 */}
          <TextField
            label="자산 이름"
            placeholder={`예: KB${type === "BANK" ? "국민은행" : type === "CARD" ? "신용카드" : type === "CASH" ? "지갑" : type === "INVESTMENT" ? "주식계좌" : "포인트"}`}
            fullWidth
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
            required
          />

          {/* 현재 잔액 */}
          <TextField
            label="현재 잔액"
            fullWidth
            size="small"
            value={balance}
            onChange={(e) => setBalance(e.target.value.replace(/[^0-9-]/g, ""))}
            InputProps={{
              endAdornment: <InputAdornment position="end">원</InputAdornment>,
            }}
            sx={{ mb: 2 }}
            helperText="카드는 현재 사용 가능 한도 또는 청구 예정 금액을 입력하세요."
          />

          {/* 메모 */}
          <TextField
            label="메모 (선택)"
            fullWidth
            size="small"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            sx={{ mb: 2.5 }}
          />

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading || !name.trim()}
            size="large"
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: cfg.color,
              "&:hover": { bgcolor: alpha(cfg.color, 0.85) },
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : "자산 추가"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AssetCreateModal;
