// src/features/Transaction/components/TransactionEditModal.tsx

import React, { useState, useEffect } from "react";
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
  type SelectChangeEvent,
  CircularProgress,
  Alert,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";

import transactionApi from "../../../entities/transaction/api/transactionApi";
import type {
  TransactionResponseDto,
  TransactionUpdateRequestDto,
} from "../../../entities/transaction/api/transaction.types";
import axios from "axios";

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
  transactionToEdit: TransactionResponseDto | null; // 수정할 거래 데이터 (초기값 설정용)
  onClose: () => void;
}

const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  isOpen,
  transactionToEdit,
  onClose,
}) => {
  // 폼 필드 상태 관리 (초기값은 transactionToEdit에서 가져옴)
  const [type, setType] = useState<"INCOME" | "EXPENSE">(
    transactionToEdit?.type ?? "EXPENSE"
  );
  const [amount, setAmount] = useState<string>(
    transactionToEdit?.amount.toString() ?? ""
  );
  const [categorySeq, setCategorySeq] = useState<number | undefined>(
    transactionToEdit?.categorySeq
  );
  const [description, setDescription] = useState<string>(
    transactionToEdit?.description ?? ""
  );
  const [transactionDate, setTransactionDate] = useState<Dayjs | null>(
    transactionToEdit?.transactionDate
      ? dayjs(transactionToEdit.transactionDate)
      : dayjs()
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // transactionToEdit이 변경될 때마다 폼 필드 초기화
  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setAmount(transactionToEdit.amount.toString());
      setCategorySeq(transactionToEdit.categorySeq);
      setDescription(transactionToEdit.description || "");
      setTransactionDate(dayjs(transactionToEdit.transactionDate));
    } else {
      // transactionToEdit이 null이면 (새 모달이 열릴 때 등) 폼 필드 초기화
      setType("EXPENSE");
      setAmount("");
      setCategorySeq(undefined);
      setDescription("");
      setTransactionDate(dayjs());
    }
    setLoading(false);
    setError(null);
    setSuccess(null);
  }, [transactionToEdit]);

  const categories =
    type === "EXPENSE"
      ? ["식비", "교통비", "문화생활", "통신비", "월세", "기타지출"]
      : ["월급", "부수입", "용돈", "환급", "기타수입"];

  const handleClose = () => {
    onClose(); // 부모 컴포넌트의 onClose 호출
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!transactionToEdit?.seq) {
      // 수정할 거래 ID가 없으면 에러
      setError("수정할 거래를 찾을 수 없습니다.");
      return;
    }
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
      const updatedTransaction: TransactionUpdateRequestDto = {
        type: type,
        amount: parseFloat(amount),
        categorySeq: categorySeq,
        description: description,
        transactionDate: transactionDate?.second(0)?.format("YYYYMMDDHHmmss"),
      };

      await transactionApi.updateTransaction(
        transactionToEdit.seq,
        updatedTransaction
      );
      setSuccess("거래가 성공적으로 수정되었습니다!");
      handleClose();
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data as { message?: string };
        setError(`거래 수정 실패: ${data.message ?? err.message}`);
      } else {
        setError("거래 수정 중 예상치 못한 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="transaction-edit-modal-title"
      aria-describedby="transaction-edit-modal-description"
    >
      <Box sx={style} component="form" onSubmit={(e) => void handleSubmit(e)}>
        <Typography
          id="transaction-edit-modal-title"
          variant="h5"
          component="h2"
          mb={3}
        >
          거래 수정
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

        {/* CreateModal과 동일한 폼 필드들 */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="type-select-label">종류</InputLabel>
          <Select
            labelId="type-select-label"
            id="type-select"
            value={type}
            label="종류"
            onChange={(e: SelectChangeEvent<"INCOME" | "EXPENSE">) => {
              setType(e.target.value);
              setCategorySeq(undefined);
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
            value={categorySeq}
            label="카테고리"
            onChange={(e) => setCategorySeq(e.target.value)}
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
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
            {loading ? "수정 중..." : "거래 수정"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default TransactionEditModal;
