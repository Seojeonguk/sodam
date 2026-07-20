import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import axios from "axios";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/ko";
import { alpha, useTheme } from "@mui/material/styles";

import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";
import categoryApi from "../../../entities/category/api/categoryApi";
import type { CategoryListItemResponse } from "../../../entities/transaction/api/category.types";
import transactionApi from "../../../entities/transaction/api/transactionApi";
import type { TransactionCreateRequestDto } from "../../../entities/transaction/api/transaction.types";
import {
  CATEGORY_SELECTION_PAGE_SIZE,
  DEFAULT_PAGE_INDEX,
} from "../../../shared/config/app";

dayjs.locale("ko");

const QUICK_AMOUNTS = [
  { label: "+1천", value: 1_000 },
  { label: "+5천", value: 5_000 },
  { label: "+1만", value: 10_000 },
  { label: "+5만", value: 50_000 },
  { label: "+10만", value: 100_000 },
];

const getApiErrorMessage = (payload: unknown): string | null => {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }
  return null;
};

interface TransactionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

const TransactionCreateModal: React.FC<TransactionCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const theme = useTheme();
  const { currentAccountBook } = useAccountBookContext();

  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<number | "">("");
  const [description, setDescription] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<Dayjs>(dayjs());
  const [categories, setCategories] = useState<CategoryListItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 카테고리 목록: type 변경마다 재조회
  useEffect(() => {
    if (!isOpen || !currentAccountBook?.id) {
      setCategories([]);
      return;
    }
    const fetch = async () => {
      try {
        const res = await categoryApi.getCategories(
          DEFAULT_PAGE_INDEX,
          CATEGORY_SELECTION_PAGE_SIZE,
          type,
        );
        setCategories(res.categories ?? []);
        setCategory("");
      } catch (err) {
        if (axios.isAxiosError(err) && err.response) {
          setError(`카테고리 조회 실패: ${getApiErrorMessage(err.response.data) ?? err.message}`);
        }
      }
    };
    void fetch();
  }, [currentAccountBook?.id, isOpen, type]);

  const handleClose = () => {
    setType("EXPENSE");
    setAmount("");
    setCategory("");
    setDescription("");
    setTransactionDate(dayjs());
    setCategories([]);
    setLoading(false);
    setError(null);
    onClose();
  };

  const handleAddQuickAmount = (value: number) => {
    setAmount((prev) => String((parseInt(prev || "0", 10) + value)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentAccountBook?.id) {
      setError("가계부를 먼저 선택해 주세요.");
      return;
    }
    const parsed = parseInt(amount, 10);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError("금액을 올바르게 입력해 주세요.");
      return;
    }
    if (category === "") {
      setError("카테고리를 선택해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const req: TransactionCreateRequestDto = {
        accountBookSeq: currentAccountBook.id,
        type,
        amount: parsed,
        categorySeq: category,
        description,
        transactionDate: transactionDate.second(0).format("YYYYMMDDHHmmss"),
      };
      await transactionApi.createTransaction(req);
      await onSuccess();
      handleClose();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(`거래 추가 실패: ${getApiErrorMessage(err.response.data) ?? err.message}`);
      } else {
        setError("거래를 추가하는 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isExpense = type === "EXPENSE";
  const typeColor = isExpense ? theme.palette.error : theme.palette.success;
  const canSubmit = !!amount && parseInt(amount, 10) > 0 && category !== "";

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      // 모바일: 하단에서 올라오는 바텀시트, 데스크톱: 중앙 다이얼로그
      sx={{
        "& .MuiDialog-container": {
          alignItems: { xs: "flex-end", sm: "center" },
        },
      }}
      PaperProps={{
        component: "form",
        onSubmit: (e: React.FormEvent) => void handleSubmit(e),
        sx: {
          m: { xs: 0, sm: 2 },
          width: { xs: "100%", sm: 440 },
          maxWidth: { xs: "100%", sm: 440 },
          maxHeight: { xs: "92vh", sm: "88vh" },
          borderRadius: { xs: "20px 20px 0 0", sm: 3 },
          overflowY: "auto",
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* 모바일 드래그 핸들 */}
        <Box
          sx={{
            display: { xs: "flex", sm: "none" },
            justifyContent: "center",
            pt: 1.5,
            pb: 0.5,
          }}
        >
          <Box
            sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: "action.disabled" }}
          />
        </Box>

        <Box sx={{ px: { xs: 2.5, sm: 3 }, pb: { xs: 2.5, sm: 3 }, pt: { xs: 1, sm: 2.5 } }}>
          {/* 제목 */}
          <Typography variant="h6" fontWeight={700} mb={2.5}>
            거래 추가
          </Typography>

          {/* ── 1. 유형 토글 ── */}
          <ToggleButtonGroup
            value={type}
            exclusive
            onChange={(_, v: "INCOME" | "EXPENSE" | null) => {
              if (v) { setType(v); setCategory(""); }
            }}
            fullWidth
            sx={{
              mb: 2.5,
              "& .MuiToggleButton-root": {
                flex: 1,
                py: 1.25,
                fontSize: "0.95rem",
                fontWeight: 700,
                border: "1.5px solid",
                borderColor: "divider",
                borderRadius: "10px !important",
                transition: "all 0.15s ease",
                "&.Mui-selected": {
                  borderWidth: "1.5px",
                },
              },
              gap: 1.5,
            }}
          >
            <ToggleButton
              value="EXPENSE"
              sx={{
                "&.Mui-selected": {
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  color: "error.main",
                  borderColor: `${theme.palette.error.main} !important`,
                },
              }}
            >
              지출
            </ToggleButton>
            <ToggleButton
              value="INCOME"
              sx={{
                "&.Mui-selected": {
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  color: "success.main",
                  borderColor: `${theme.palette.success.main} !important`,
                },
              }}
            >
              수입
            </ToggleButton>
          </ToggleButtonGroup>

          {/* ── 2. 금액 입력 ── */}
          <Box mb={2}>
            <TextField
              fullWidth
              label="금액"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputProps={{ min: 0, style: { fontSize: "1.3rem", fontWeight: 800 } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography fontWeight={600} color="text.secondary">원</Typography>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />
            {/* 빠른 금액 칩 */}
            <Box display="flex" gap={0.75} flexWrap="wrap">
              {QUICK_AMOUNTS.map(({ label, value }) => (
                <Chip
                  key={value}
                  label={label}
                  size="small"
                  onClick={() => handleAddQuickAmount(value)}
                  sx={{
                    cursor: "pointer",
                    fontWeight: 600,
                    bgcolor: alpha(typeColor.main, 0.08),
                    color: isExpense ? "error.dark" : "success.dark",
                    border: "1px solid",
                    borderColor: alpha(typeColor.main, 0.25),
                    "&:hover": { bgcolor: alpha(typeColor.main, 0.15) },
                  }}
                />
              ))}
              {amount && (
                <Chip
                  label="초기화"
                  size="small"
                  variant="outlined"
                  onClick={() => setAmount("")}
                  sx={{ cursor: "pointer" }}
                />
              )}
            </Box>
          </Box>

          {/* ── 3. 카테고리 칩 그리드 ── */}
          <Box mb={2}>
            <Typography
              variant="caption"
              fontWeight={700}
              color="text.secondary"
              sx={{ display: "block", mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}
            >
              카테고리
            </Typography>
            {categories.length === 0 ? (
              <Typography variant="body2" color="text.disabled" sx={{ py: 1 }}>
                카테고리가 없습니다. 먼저 카테고리를 추가해 주세요.
              </Typography>
            ) : (
              <Box
                display="flex"
                gap={0.75}
                flexWrap="wrap"
                sx={{ maxHeight: 120, overflowY: "auto", pr: 0.5 }}
              >
                {categories.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <Chip
                      key={cat.id}
                      label={cat.name}
                      onClick={() => setCategory(cat.id)}
                      sx={{
                        cursor: "pointer",
                        fontWeight: isSelected ? 700 : 500,
                        bgcolor: isSelected
                          ? alpha(typeColor.main, 0.15)
                          : "action.hover",
                        color: isSelected
                          ? isExpense ? "error.dark" : "success.dark"
                          : "text.primary",
                        border: "1.5px solid",
                        borderColor: isSelected
                          ? alpha(typeColor.main, 0.5)
                          : "transparent",
                        transition: "all 0.15s ease",
                        "&:hover": {
                          bgcolor: alpha(typeColor.main, 0.1),
                        },
                      }}
                    />
                  );
                })}
              </Box>
            )}
          </Box>

          {/* ── 4. 메모 (선택) ── */}
          <TextField
            fullWidth
            label="메모 (선택)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          />

          {/* ── 5. 날짜 ── */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="날짜"
              value={transactionDate}
              format="YYYY년 M월 D일"
              onChange={(v) => { if (v) setTransactionDate(v); }}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  sx: { mb: 2.5 },
                },
              }}
            />
          </LocalizationProvider>

          {/* 에러 */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* ── 6. 제출 버튼 ── */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || !canSubmit}
            sx={{
              py: 1.5,
              fontWeight: 700,
              fontSize: "1rem",
              borderRadius: 2,
              bgcolor: canSubmit ? typeColor.main : undefined,
              "&:hover": { bgcolor: canSubmit ? typeColor.dark : undefined },
              transition: "background-color 0.2s ease",
            }}
          >
            {loading ? (
              <CircularProgress size={22} sx={{ color: "inherit" }} />
            ) : (
              `${isExpense ? "지출" : "수입"} ${amount && parseInt(amount, 10) > 0 ? parseInt(amount, 10).toLocaleString("ko-KR") + "원 추가" : "추가"}`
            )}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionCreateModal;
