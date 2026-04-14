import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { type Dayjs } from "dayjs";
import axios from "axios";
import categoryApi from "../../../entities/category/api/categoryApi";
import transactionApi from "../../../entities/transaction/api/transactionApi";
import type { CategoryListItemResponse } from "../../../entities/transaction/api/category.types";
import type {
  TransactionResponseDto,
  TransactionUpdateRequestDto,
} from "../../../entities/transaction/api/transaction.types";
import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  borderRadius: "8px",
};

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
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [categorySeq, setCategorySeq] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState<Dayjs | null>(dayjs());
  const [categories, setCategories] = useState<CategoryListItemResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transactionToEdit) {
      setType("EXPENSE");
      setAmount("");
      setCategorySeq("");
      setDescription("");
      setTransactionDate(dayjs());
      setCategories([]);
      setError(null);
      setLoading(false);
      return;
    }

    setType(transactionToEdit.type);
    setAmount(transactionToEdit.amount.toString());
    setCategorySeq(transactionToEdit.categorySeq ?? "");
    setDescription(transactionToEdit.description ?? "");
    setTransactionDate(dayjs(transactionToEdit.transactionDate));
    setError(null);
    setLoading(false);
  }, [transactionToEdit]);

  useEffect(() => {
    const fetchModalOptions = async () => {
      if (!isOpen || !currentAccountBook?.id) {
        setCategories([]);
        return;
      }

      try {
        const fetchedCategories = await categoryApi.getCategories(0, 100);
        setCategories(fetchedCategories.categories ?? []);
      } catch (nextError) {
        if (axios.isAxiosError(nextError)) {
          setError(nextError.message);
        } else {
          setError("카테고리 목록을 불러오는 중 오류가 발생했습니다.");
        }
      }
    };

    void fetchModalOptions();
  }, [currentAccountBook?.id, isOpen]);

  const handleClose = () => {
    setError(null);
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!transactionToEdit?.seq) {
      setError("수정할 거래를 찾을 수 없습니다.");
      return;
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      setError("금액을 올바르게 입력해 주세요.");
      return;
    }

    if (!transactionDate) {
      setError("거래 날짜를 선택해 주세요.");
      return;
    }

    if (categorySeq === "") {
      setError("카테고리를 선택해 주세요.");
      return;
    }

    setLoading(true);

    try {
      const payload: TransactionUpdateRequestDto = {
        type,
        amount: Number.parseFloat(amount),
        categorySeq,
        description,
        transactionDate: transactionDate.second(0).format("YYYYMMDDHHmmss"),
      };

      await transactionApi.updateTransaction(transactionToEdit.seq, payload);
      await onSuccess();
      handleClose();
    } catch (nextError) {
      if (axios.isAxiosError(nextError)) {
        setError(nextError.message);
      } else {
        setError("거래 수정 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!transactionToEdit) {
    return null;
  }

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="transaction-edit-modal-title"
      aria-describedby="transaction-edit-modal-description"
    >
      <Box sx={style} component="form" onSubmit={(event) => void handleSubmit(event)}>
        <Typography
          id="transaction-edit-modal-title"
          variant="h5"
          component="h2"
          mb={3}
        >
          거래 수정
        </Typography>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="type-select-label">유형</InputLabel>
          <Select
            labelId="type-select-label"
            id="type-select"
            value={type}
            label="유형"
            onChange={(event: SelectChangeEvent<"INCOME" | "EXPENSE">) => {
              setType(event.target.value);
              setCategorySeq("");
            }}
          >
            <MenuItem value="EXPENSE">지출</MenuItem>
            <MenuItem value="INCOME">수입</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="금액"
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          margin="normal"
          required
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="category-select-label">카테고리</InputLabel>
          <Select
            labelId="category-select-label"
            id="category-select"
            value={categorySeq}
            label="카테고리"
            onChange={(event) => setCategorySeq(Number(event.target.value))}
            required
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="내용 (선택 사항)"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          margin="normal"
          multiline
          rows={2}
          sx={{ mb: 2 }}
        />

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateTimePicker
            label="거래 날짜 및 시간"
            value={transactionDate}
            onChange={(newValue) => setTransactionDate(newValue)}
            sx={{ width: "100%", mb: 3 }}
          />
        </LocalizationProvider>

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
            {loading ? "수정 중..." : "거래 수정"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default TransactionEditModal;
