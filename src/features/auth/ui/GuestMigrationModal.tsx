import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  LinearProgress,
  Modal,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { CheckCircle, CloudUpload, Person } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { migrateGuestData, type MigrationProgress } from "../lib/guestMigration";
import { guestStore } from "../../../shared/lib/guestStore";
import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";

interface GuestMigrationModalProps {
  open: boolean;
  onClose: () => void;
}

const STEP_LABELS: Record<MigrationProgress["step"], string> = {
  signup: "계정을 생성하는 중...",
  login: "로그인 중...",
  accountbook: "가계부를 만드는 중...",
  categories: "카테고리를 업로드하는 중...",
  transactions: "거래 내역을 업로드하는 중...",
  done: "완료!",
};

export function GuestMigrationModal({ open, onClose }: GuestMigrationModalProps) {
  const navigate = useNavigate();
  const { fetchAccountBooks } = useAccountBookContext();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<MigrationProgress | null>(null);
  const [done, setDone] = useState(false);

  const guestCategories = guestStore.getCategories(0, 1000).categories.length;
  const guestTransactions = guestStore.getRawTransactions().length;

  const progressPercent = progress
    ? progress.step === "done"
      ? 100
      : progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 20
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !name) {
      setError("모든 필드를 입력해 주세요.");
      return;
    }

    try {
      await migrateGuestData(email, password, name, setProgress);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "연동 중 오류가 발생했습니다.");
      setProgress(null);
    }
  };

  const handleGoToDashboard = async () => {
    await fetchAccountBooks();
    void navigate("/dashboard");
    onClose();
  };

  const isLoading = progress !== null && !done;

  return (
    <Modal open={open} onClose={isLoading ? undefined : onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 460 },
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <Paper sx={{ p: 4, borderRadius: 4 }}>
          {/* 헤더 */}
          <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
            <CloudUpload color="primary" />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                계정 만들고 데이터 연동하기
              </Typography>
              <Typography variant="body2" color="text.secondary">
                지금까지의 데이터를 새 계정에 저장합니다.
              </Typography>
            </Box>
          </Stack>

          {/* 마이그레이션 대상 미리보기 */}
          {!done && (
            <Paper
              variant="outlined"
              sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: alpha("#6366f1", 0.04) }}
            >
              <Typography variant="body2" fontWeight={600} mb={1}>
                연동될 데이터
              </Typography>
              <Stack direction="row" spacing={3}>
                <Stack alignItems="center">
                  <Typography variant="h6" fontWeight={700} color="primary">
                    {guestCategories}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    카테고리
                  </Typography>
                </Stack>
                <Stack alignItems="center">
                  <Typography variant="h6" fontWeight={700} color="primary">
                    {guestTransactions}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    거래 내역
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          )}

          {/* 완료 화면 */}
          {done ? (
            <Stack alignItems="center" spacing={2} py={2}>
              <CheckCircle sx={{ fontSize: 56, color: "success.main" }} />
              <Typography variant="h6" fontWeight={700}>
                연동 완료!
              </Typography>
              <Typography color="text.secondary" textAlign="center">
                게스트 데이터가 새 계정으로 성공적으로 이전됐습니다.
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => void handleGoToDashboard()}
                sx={{ mt: 1 }}
              >
                대시보드로 이동
              </Button>
            </Stack>
          ) : (
            <Box component="form" onSubmit={(e) => void handleSubmit(e)}>
              {/* 폼 필드 */}
              <Stack spacing={2} mb={3}>
                <TextField
                  label="이름"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  size="small"
                  InputProps={{ startAdornment: <Person fontSize="small" sx={{ mr: 1, color: "text.secondary" }} /> }}
                />
                <TextField
                  label="이메일"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  size="small"
                />
                <TextField
                  label="비밀번호"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  size="small"
                />
              </Stack>

              {/* 진행 상태 */}
              {progress && (
                <Box mb={2}>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      {STEP_LABELS[progress.step]}
                      {progress.total > 0 &&
                        ` (${progress.current}/${progress.total})`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {progressPercent}%
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={progressPercent} sx={{ borderRadius: 1 }} />
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <Stack direction="row" spacing={1.5}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={onClose}
                  disabled={isLoading}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={16} /> : null}
                >
                  {isLoading ? "연동 중..." : "연동하기"}
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>
      </Box>
    </Modal>
  );
}
