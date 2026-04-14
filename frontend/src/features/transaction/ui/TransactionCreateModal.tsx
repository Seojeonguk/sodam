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
import axios from "axios";
import dayjs, { type Dayjs } from "dayjs";

import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";
import categoryApi from "../../../entities/category/api/categoryApi";
import classificationApi from "../../../entities/category/api/classificationApi";
import type { ClassificationResponse } from "../../../entities/category/api/classification.types";
import type { CategoryListItemResponse } from "../../../entities/transaction/api/category.types";
import transactionApi from "../../../entities/transaction/api/transactionApi";
import type { TransactionCreateRequestDto } from "../../../entities/transaction/api/transaction.types";
import {
  CATEGORY_SELECTION_PAGE_SIZE,
  DEFAULT_PAGE_INDEX,
} from "../../../shared/config/app";

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

interface TransactionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

const classificationLabelMap: Record<"INCOME" | "EXPENSE", string> = {
  INCOME: "수입",
  EXPENSE: "지출",
};

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

const TransactionCreateModal: React.FC<TransactionCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentAccountBook } = useAccountBookContext();

  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [classifications, setClassifications] = useState<ClassificationResponse[]>(
    [],
  );
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<number | "">("");
  const [description, setDescription] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<Dayjs | null>(dayjs());
  const [categories, setCategories] = useState<CategoryListItemResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchModalOptions = async () => {
      if (!currentAccountBook?.id) {
        setClassifications([]);
        setCategories([]);
        return;
      }

      try {
        const [fetchedClassifications, fetchedCategories] = await Promise.all([
          classificationApi.getClassifications(currentAccountBook.id),
          categoryApi.getCategories(
            DEFAULT_PAGE_INDEX,
            CATEGORY_SELECTION_PAGE_SIZE,
          ),
        ]);

        setClassifications(fetchedClassifications);
        setCategories(fetchedCategories.categories ?? []);

        if (fetchedClassifications.length > 0) {
          setType((currentType) =>
            fetchedClassifications.some(
              (classification) => classification.name === currentType,
            )
              ? currentType
              : fetchedClassifications[0].name,
          );
        }
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response) {
          setError(
            `분류 또는 카테고리 목록 조회 실패: ${getApiErrorMessage(err.response.data) ?? err.message}`,
          );
        } else {
          setError("분류 또는 카테고리 목록을 불러오는 중 오류가 발생했습니다.");
        }
      }
    };

    if (!isOpen) {
      return;
    }

    void fetchModalOptions();
  }, [currentAccountBook?.id, isOpen]);

  const handleClose = () => {
    setType("EXPENSE");
    setClassifications([]);
    setAmount("");
    setCategory("");
    setDescription("");
    setTransactionDate(dayjs());
    setCategories([]);
    setLoading(false);
    setError(null);
    setSuccess(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentAccountBook?.id) {
      setError("가계부를 먼저 선택해 주세요.");
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

    if (category === "") {
      setError("카테고리를 선택해 주세요.");
      return;
    }

    setLoading(true);

    try {
      const newTransaction: TransactionCreateRequestDto = {
        accountBookSeq: currentAccountBook.id,
        type,
        amount: Number.parseFloat(amount),
        categorySeq: category,
        description,
        transactionDate: transactionDate.second(0).format("YYYYMMDDHHmmss"),
      };

      await transactionApi.createTransaction(newTransaction);
      await onSuccess();
      setSuccess("거래가 성공적으로 추가되었습니다.");
      handleClose();
      } catch (err: unknown) {
        if (axios.isAxiosError(err) && err.response) {
        setError(`거래 추가 실패: ${getApiErrorMessage(err.response.data) ?? err.message}`);
        } else {
          setError("거래를 추가하는 중 오류가 발생했습니다.");
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="transaction-create-modal-title"
      aria-describedby="transaction-create-modal-description"
    >
      <Box sx={style} component="form" onSubmit={(event) => void handleSubmit(event)}>
        <Typography
          id="transaction-create-modal-title"
          variant="h5"
          component="h2"
          mb={3}
        >
          거래 추가
        </Typography>

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        {success ? (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
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
              setCategory("");
            }}
          >
            {classifications.map((classification) => (
              <MenuItem key={classification.id} value={classification.name}>
                {classificationLabelMap[classification.name] ?? classification.name}
              </MenuItem>
            ))}
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
            value={category}
            label="카테고리"
            onChange={(event) => setCategory(Number(event.target.value))}
            required
          >
            {categories.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
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
            {loading ? "추가 중..." : "거래 추가"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default TransactionCreateModal;
