import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ASSET_TYPE_CONFIG, type AssetResponse } from "../../../entities/asset/api/asset.types";
import { getServerErrorMessage } from "../../../shared/lib/serverState";

interface Props {
  open: boolean;
  asset: AssetResponse | null;
  onClose: () => void;
  onSubmit: (assetSeq: number, balance: number, note?: string) => Promise<void>;
}

const AssetBalanceModal: React.FC<Props> = ({ open, asset, onClose, onSubmit }) => {
  const [balance, setBalance] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setBalance(""); setNote(""); setError(null); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    const parsed = parseInt(balance.replace(/,/g, ""), 10);
    if (isNaN(parsed)) { setError("올바른 금액을 입력해 주세요."); return; }

    setLoading(true);
    setError(null);
    try {
      await onSubmit(asset.seq, parsed, note.trim() || undefined);
      handleClose();
    } catch (e) {
      setError(getServerErrorMessage(e, "잔액 기록 중 오류가 발생했습니다."));
    } finally {
      setLoading(false);
    }
  };

  if (!asset) return null;
  const cfg = ASSET_TYPE_CONFIG[asset.type];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      sx={{ "& .MuiDialog-container": { alignItems: { xs: "flex-end", sm: "center" } } }}
      PaperProps={{
        sx: {
          m: { xs: 0, sm: 2 },
          width: { xs: "100%", sm: undefined },
          maxWidth: { xs: "100%", sm: 444 },
          borderRadius: { xs: "20px 20px 0 0", sm: 3 },
          maxHeight: { xs: "92vh", sm: "85vh" },
        },
      }}
    >
      {/* 모바일 드래그 핸들 */}
      <Box sx={{ display: { xs: "flex", sm: "none" }, justifyContent: "center", pt: 1.5, pb: 0.5 }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: "action.disabled" }} />
      </Box>
      <DialogTitle sx={{ fontWeight: 800, pb: 0 }}>잔액 기록</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {/* 현재 잔액 표시 */}
        <Box sx={{
          mb: 2.5, p: 2, borderRadius: 2,
          bgcolor: alpha(cfg.color, 0.08),
          border: `1px solid ${alpha(cfg.color, 0.2)}`,
        }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {asset.name} 현재 잔액
          </Typography>
          <Typography variant="h5" fontWeight={800} sx={{ color: cfg.color }}>
            {asset.balance.toLocaleString("ko-KR")}원
          </Typography>
        </Box>

        <Box component="form" onSubmit={(e) => void handleSubmit(e)}>
          <TextField
            label="새 잔액"
            fullWidth
            size="small"
            autoFocus
            value={balance}
            onChange={(e) => setBalance(e.target.value.replace(/[^0-9-]/g, ""))}
            InputProps={{
              endAdornment: <InputAdornment position="end">원</InputAdornment>,
            }}
            sx={{ mb: 2 }}
            helperText={(() => {
              const v = parseInt(balance.replace(/,/g, ""), 10);
              if (!isNaN(v)) {
                const delta = v - asset.balance;
                return delta === 0 ? "변동 없음" : `${delta >= 0 ? "+" : ""}${delta.toLocaleString("ko-KR")}원 변동`;
              }
              return "실제 잔액을 입력하세요.";
            })()}
          />
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
            disabled={loading || !balance}
            size="large"
            sx={{
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: cfg.color,
              "&:hover": { bgcolor: alpha(cfg.color, 0.85) },
            }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : "기록하기"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AssetBalanceModal;
