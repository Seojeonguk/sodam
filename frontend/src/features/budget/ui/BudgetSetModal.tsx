import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import type { CategoryListItemResponse } from "../../../entities/transaction/api/category.types";
import type { BudgetSummaryResponse } from "../../../entities/budget/api/budget.types";

// 빠른 금액 칩 (만 단위)
const QUICK_AMOUNTS = [50000, 100000, 200000, 300000, 500000];

interface BudgetSetModalProps {
  open: boolean;
  onClose: () => void;
  /** 수정 대상 (null이면 신규 추가) */
  target: BudgetSummaryResponse | null;
  /** 예산 미설정 카테고리 목록 (신규 추가 시 사용) */
  availableCategories: CategoryListItemResponse[];
  onSave: (categorySeq: number, amount: number) => Promise<void>;
}

export default function BudgetSetModal({
  open,
  onClose,
  target,
  availableCategories,
  onSave,
}: BudgetSetModalProps) {
  const theme = useTheme();
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);
  const [amountStr, setAmountStr] = useState("");
  const [saving, setSaving] = useState(false);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setSelectedCatId(target?.categorySeq ?? null);
      setAmountStr(target ? String(target.budgetAmount) : "");
      setSaving(false);
    }
  }, [open, target]);

  const amount = Number(amountStr.replace(/,/g, "")) || 0;
  const isEdit = Boolean(target?.hasBudget);
  const canSave = amount > 0 && (isEdit ? true : selectedCatId !== null);

  const handleSave = async () => {
    const catId = isEdit ? target!.categorySeq! : selectedCatId!;
    setSaving(true);
    try {
      await onSave(catId, amount);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleAmountChange = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    setAmountStr(digits ? Number(digits).toLocaleString("ko-KR") : "");
  };

  const addAmount = (val: number) => {
    const current = Number(amountStr.replace(/,/g, "")) || 0;
    setAmountStr((current + val).toLocaleString("ko-KR"));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      sx={{
        "& .MuiDialog-container": {
          alignItems: { xs: "flex-end", sm: "center" },
        },
      }}
      PaperProps={{
        sx: {
          m: { xs: 0, sm: 2 },
          borderRadius: { xs: "20px 20px 0 0", sm: 3 },
          maxHeight: { xs: "88vh", sm: "80vh" },
        },
      }}
    >
      {/* 드래그 핸들 (모바일) */}
      <Box sx={{ display: { xs: "flex", sm: "none" }, justifyContent: "center", pt: 1.5, pb: 0.5 }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: "action.disabled" }} />
      </Box>

      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
        {isEdit ? "예산 수정" : "예산 추가"}
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <Stack spacing={2.5}>

          {/* 카테고리 선택 (신규 추가 시) */}
          {!isEdit && (
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary"
                sx={{ display: "block", mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                카테고리
              </Typography>
              {availableCategories.length === 0 ? (
                <Typography variant="body2" color="text.disabled">
                  모든 카테고리에 예산이 설정되어 있습니다.
                </Typography>
              ) : (
                <Box display="flex" flexWrap="wrap" gap={0.75}>
                  {availableCategories.map((cat) => {
                    const isSelected = selectedCatId === cat.id;
                    const isIncome = cat.type === "INCOME";
                    return (
                      <Chip
                        key={cat.id}
                        label={cat.name}
                        size="small"
                        onClick={() => setSelectedCatId(isSelected ? null : cat.id)}
                        sx={{
                          fontWeight: isSelected ? 700 : 500,
                          bgcolor: isSelected
                            ? isIncome
                              ? alpha(theme.palette.success.main, 0.15)
                              : alpha(theme.palette.error.main, 0.15)
                            : "action.hover",
                          color: isSelected
                            ? isIncome ? "success.dark" : "error.dark"
                            : "text.secondary",
                          border: "1.5px solid",
                          borderColor: isSelected
                            ? isIncome
                              ? alpha(theme.palette.success.main, 0.5)
                              : alpha(theme.palette.error.main, 0.5)
                            : "transparent",
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            </Box>
          )}

          {/* 수정 시 카테고리 표시 */}
          {isEdit && target && (
            <Box sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: "action.hover",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}>
              {target.categoryColor && (
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: target.categoryColor, flexShrink: 0 }} />
              )}
              <Typography variant="body2" fontWeight={600}>{target.categoryName}</Typography>
            </Box>
          )}

          {/* 금액 입력 */}
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ display: "block", mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              월 예산 금액
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="0"
              value={amountStr}
              onChange={(e) => handleAmountChange(e.target.value)}
              inputMode="numeric"
              InputProps={{
                endAdornment: <InputAdornment position="end">원</InputAdornment>,
                sx: { fontWeight: 700, fontSize: "1.1rem" },
              }}
            />
            {/* 빠른 금액 추가 버튼 */}
            <Box display="flex" gap={0.75} flexWrap="wrap" mt={1.5}>
              {QUICK_AMOUNTS.map((val) => (
                <Chip
                  key={val}
                  label={`+${(val / 10000).toLocaleString()}만`}
                  size="small"
                  onClick={() => addAmount(val)}
                  sx={{ cursor: "pointer", fontWeight: 600, bgcolor: "action.hover" }}
                />
              ))}
            </Box>
          </Box>

          {/* 저장 버튼 */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            disabled={!canSave || saving}
            onClick={() => void handleSave()}
            sx={{ fontWeight: 700, borderRadius: 2, textTransform: "none", mt: 0.5 }}
          >
            {saving ? "저장 중..." : canSave
              ? `${Number(amountStr.replace(/,/g, "")).toLocaleString("ko-KR")}원 예산 설정`
              : "카테고리와 금액을 입력하세요"}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
