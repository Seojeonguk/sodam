import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Rating,
  Select,
  Stack,
  TextField,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { type Dayjs } from "dayjs";
import axios from "axios";
import classificationApi from "../../../entities/category/api/classificationApi";
import type { ClassificationResponse } from "../../../entities/category/api/classification.types";
import categoryApi from "../../../entities/category/api/categoryApi";
import transactionApi from "../../../entities/transaction/api/transactionApi";
import type { CategoryListItemResponse } from "../../../entities/transaction/api/category.types";
import type {
  TransactionResponseDto,
  TransactionUpdateRequestDto,
} from "../../../entities/transaction/api/transaction.types";
import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";

const TYPE_LABEL: Record<string, string> = { INCOME: "수입", EXPENSE: "지출", TRANSFER: "이체" };
const RATING_LABEL = ["", "후회됨", "아쉬움", "보통", "만족", "매우 만족"];

interface TransactionEditModalProps {
  isOpen: boolean;
  transactionToEdit: TransactionResponseDto | null;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  isOpen,
  transactionToEdit,
  onClose,
  onSuccess,
}) => {
  const { currentAccountBook } = useAccountBookContext();
  const [type, setType] = useState<string>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [categorySeq, setCategorySeq] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState<Dayjs | null>(dayjs());
  const [satisfactionRating, setSatisfactionRating] = useState<number | null>(null);
  const [classifications, setClassifications] = useState<ClassificationResponse[]>([]);
  const [categories, setCategories] = useState<CategoryListItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 분류 목록 로드
  useEffect(() => {
    if (!isOpen) { setClassifications([]); return; }
    void classificationApi.getClassifications(currentAccountBook?.id).then(setClassifications).catch(() => {});
  }, [isOpen, currentAccountBook?.id]);

  // 수정 대상 거래 초기값 세팅
  useEffect(() => {
    if (!transactionToEdit) {
      setType("EXPENSE"); setAmount(""); setCategorySeq(""); setDescription("");
      setTransactionDate(dayjs()); setSatisfactionRating(null);
      setClassifications([]); setCategories([]); setError(null); setLoading(false);
      return;
    }
    setType(transactionToEdit.type);
    setAmount(transactionToEdit.amount.toString());
    setCategorySeq(transactionToEdit.categorySeq ?? "");
    setDescription(transactionToEdit.description ?? "");
    setTransactionDate(dayjs(transactionToEdit.transactionDate));
    setSatisfactionRating(transactionToEdit.satisfactionRating > 0 ? transactionToEdit.satisfactionRating : null);
    setError(null); setLoading(false);
  }, [transactionToEdit]);

  // type 바뀔 때 카테고리 재조회
  useEffect(() => {
    if (!isOpen) { setCategories([]); return; }
    void (async () => {
      try {
        const res = await categoryApi.getCategories(undefined, undefined, type as "INCOME" | "EXPENSE" | "TRANSFER");
        setCategories(res ?? []);
      } catch (e) {
        if (axios.isAxiosError(e)) setError(e.message);
      }
    })();
  }, [isOpen, type]);

  const handleClose = () => { setError(null); setLoading(false); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!transactionToEdit?.seq) { setError("수정할 거래를 찾을 수 없습니다."); return; }
    if (!amount || Number.parseFloat(amount) <= 0) { setError("금액을 올바르게 입력해 주세요."); return; }
    if (!transactionDate) { setError("거래 날짜를 선택해 주세요."); return; }
    if (categorySeq === "") { setError("카테고리를 선택해 주세요."); return; }

    setLoading(true);
    try {
      const payload: TransactionUpdateRequestDto = {
        type,
        amount: Number.parseFloat(amount),
        categorySeq,
        description,
        transactionDate: transactionDate.second(0).format("YYYYMMDDHHmmss"),
        satisfactionRating: satisfactionRating ?? undefined,
      };
      await transactionApi.updateTransaction(transactionToEdit.seq, payload);
      await onSuccess();
      handleClose();
    } catch (e) {
      setError(axios.isAxiosError(e) ? e.message : "거래 수정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!transactionToEdit) return null;

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      sx={{ "& .MuiDialog-container": { alignItems: { xs: "flex-end", sm: "center" } } }}
      PaperProps={{
        component: "form",
        onSubmit: (e: React.FormEvent) => void handleSubmit(e),
        sx: {
          m: { xs: 0, sm: 2 },
          width: { xs: "100%", sm: undefined },
          maxWidth: { xs: "100%", sm: 444 },
          borderRadius: { xs: "20px 20px 0 0", sm: 3 },
          maxHeight: { xs: "92vh", sm: "88vh" },
          overflowY: "auto",
        },
      }}
    >
      {/* 모바일 드래그 핸들 */}
      <Box sx={{ display: { xs: "flex", sm: "none" }, justifyContent: "center", pt: 1.5, pb: 0.5 }}>
        <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: "action.disabled" }} />
      </Box>

      <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>거래 수정</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* 유형 */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>유형</InputLabel>
          <Select
            value={type}
            label="유형"
            onChange={(e: SelectChangeEvent<string>) => { setType(e.target.value); setCategorySeq(""); }}
          >
            {(classifications.length > 0
              ? classifications
              : [{ id: -1, name: "EXPENSE" }, { id: -2, name: "INCOME" }] as ClassificationResponse[]
            ).map((cls) => (
              <MenuItem key={cls.name} value={cls.name}>{TYPE_LABEL[cls.name] ?? cls.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 금액 */}
        <TextField
          fullWidth
          label="금액"
          type="number"
          size="small"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          sx={{ mb: 2 }}
        />

        {/* 카테고리 */}
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>카테고리</InputLabel>
          <Select
            value={categorySeq}
            label="카테고리"
            onChange={(e) => setCategorySeq(Number(e.target.value))}
            required
          >
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 설명 */}
        <TextField
          fullWidth
          label="설명 (선택)"
          size="small"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* 날짜 */}
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateTimePicker
            label="거래 날짜 및 시간"
            value={transactionDate}
            onChange={(v) => setTransactionDate(v)}
            slotProps={{ textField: { size: "small", fullWidth: true, sx: { mb: 2 } } }}
          />
        </LocalizationProvider>

        {/* 만족도 */}
        <Box mb={2.5}>
          <Typography variant="caption" fontWeight={700} color="text.secondary"
            sx={{ display: "block", mb: 0.75, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            소비 만족도 (선택)
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Rating
              value={satisfactionRating}
              onChange={(_, v) => setSatisfactionRating(v)}
              size="large"
            />
            {satisfactionRating && (
              <Typography variant="caption" color="text.secondary">
                {RATING_LABEL[satisfactionRating]}
              </Typography>
            )}
          </Stack>
        </Box>

        {/* 버튼 */}
        <Stack direction="row" spacing={1.5}>
          <Button fullWidth variant="outlined" onClick={handleClose} disabled={loading}
            sx={{ fontWeight: 700, borderRadius: 2 }}>
            취소
          </Button>
          <Button fullWidth variant="contained" type="submit" disabled={loading}
            sx={{ fontWeight: 700, borderRadius: 2 }}>
            {loading ? <CircularProgress size={20} color="inherit" /> : "수정 완료"}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionEditModal;
