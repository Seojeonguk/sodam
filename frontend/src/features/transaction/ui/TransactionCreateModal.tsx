import React, { useEffect, useState } from "react";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  type SelectChangeEvent,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";

import transactionApi from "../../../entities/transaction/api/transactionApi"; // 거래 API 서비스 임포트
import type { TransactionCreateRequestDto } from "../../../entities/transaction/api/transaction.types"; // DTO 임포트
import axios, { AxiosError } from "axios"; // AxiosError 타입 체크를 위해 임포트
import api from "../../../shared/api/api";
import type {
  CategoryListItemResponse,
  CategoryListResponse,
} from "../../../entities/transaction/api/category.types";
import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";

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

const TransactionCreateModal: React.FC<TransactionCreateModalProps> = ({
  isOpen,
  onClose,
}) => {
  // 폼 필드 상태 관리
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE"); // 기본값 지출
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<number | null>(null);
  const [description, setDescription] = useState<string>("");
  const [transactionDate, setTransactionDate] = useState<Dayjs | null>(dayjs()); // dayjs 객체
  const [categories, setCategories] = useState<CategoryListItemResponse[]>([]);

  // API 호출 상태 관리
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { currentAccountBook } = useAccountBookContext();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get<CategoryListResponse>(
          `/categories?page=0&size=10`,
        );
        const data = response.data;
        setCategories(data.categories);
      } catch (error) {
        const err = error as AxiosError<{ message?: string }>;

        if (axios.isAxiosError(err) && err.response) {
          setError(
            `카테고리 목록 조회 실패: ${err.response.data?.message ?? err.message}`,
          );
        } else {
          setError("카테고리 목록 조회 중 예상치 못한 오류가 발생했습니다.");
        }
      }
    };

    void fetchCategories(); // 👈 eslint no-floating-promises 해결
  }, []);

  const handleClose = () => {
    // 모달 닫기 전 상태 초기화
    setType("EXPENSE");
    setAmount("");
    setCategory(null);
    setDescription("");
    setTransactionDate(dayjs());
    setLoading(false);
    setError(null);
    setSuccess(null);
    onClose(); // 부모 컴포넌트의 onClose 호출
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // 이전 에러 초기화
    setSuccess(null); // 이전 성공 메시지 초기화

    // 유효성 검사 (간단한 예시)
    if (!amount || parseFloat(amount) <= 0) {
      setError("금액을 올바르게 입력해주세요.");
      return;
    }
    if (!transactionDate) {
      setError("거래 날짜를 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const newTransaction: TransactionCreateRequestDto = {
        accountBookSeq: currentAccountBook?.id ?? 0,
        type: type,
        amount: parseFloat(amount), // 숫자로 변환
        categorySeq: category,
        description: description,
        transactionDate: transactionDate?.second(0)?.format("YYYYMMDDHHmmss"),
      };

      await transactionApi.createTransaction(newTransaction);
      setSuccess("거래가 성공적으로 추가되었습니다!");
      handleClose();
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;

      if (axios.isAxiosError(err) && err.response) {
        // 백엔드에서 보낸 구체적인 에러 메시지가 있다면
        setError(
          `거래 추가 실패: ${err.response.data?.message ?? err.message}`,
        );
      } else {
        setError("거래 추가 중 예상치 못한 오류가 발생했습니다.");
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
      <Box sx={style} component="form" onSubmit={(e) => void handleSubmit(e)}>
        <Typography
          id="transaction-create-modal-title"
          variant="h5"
          component="h2"
          mb={3}
        >
          새 거래 추가
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

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="type-select-label">분류</InputLabel>
          <Select
            labelId="type-select-label"
            id="type-select"
            value={type}
            label="분류"
            onChange={(e: SelectChangeEvent<"INCOME" | "EXPENSE">) => {
              setType(e.target.value);
              setCategory(null); // 분류 변경 시 카테고리 초기화
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
          onChange={(e) => setAmount(e.target.value)}
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
            onChange={(e) => setCategory(Number(e.target.value))}
            required
          >
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="내용 (선택 사항)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
