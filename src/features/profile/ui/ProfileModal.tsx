import { useEffect, useState } from "react";
import {
  alpha,
  useTheme,
} from "@mui/material/styles";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AccountCircleOutlined,
  Close,
  LockOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { supabase } from "../../../shared/lib/supabase";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface UserInfo {
  name: string;
  email: string;
  imageUrl?: string;
  provider: string; // "email" | "kakao" | "google" | ...
}

export default function ProfileModal({ open, onClose }: Props) {
  const theme = useTheme();

  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // 비밀번호 변경 폼
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    if (!open) {
      // 닫힐 때 비밀번호 폼 초기화
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwError(null);
      setPwSuccess(false);
      return;
    }

    setLoading(true);
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const provider =
        (user.app_metadata?.provider as string | undefined) ?? "email";

      // public.users에서 이름 조회 (동기화된 name 우선)
      const { data: dbUser } = await supabase
        .from("users")
        .select("name, image_url")
        .eq("email", user.email ?? "")
        .maybeSingle();

      const name =
        (dbUser?.name as string | undefined) ??
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        user.email?.split("@")[0] ?? "";

      setUserInfo({
        name,
        email: user.email ?? "",
        imageUrl: (dbUser?.image_url as string | undefined) ?? user.user_metadata?.avatar_url as string | undefined,
        provider,
      });
      setLoading(false);
    })();
  }, [open]);

  const isEmailProvider = userInfo?.provider === "email";

  const handlePasswordChange = async () => {
    setPwError(null);
    setPwSuccess(false);

    if (!currentPassword) { setPwError("현재 비밀번호를 입력해 주세요."); return; }
    if (!newPassword) { setPwError("새 비밀번호를 입력해 주세요."); return; }
    if (newPassword.length < 6) { setPwError("새 비밀번호는 최소 6자 이상이어야 합니다."); return; }
    if (newPassword !== confirmPassword) { setPwError("새 비밀번호가 일치하지 않습니다."); return; }
    if (currentPassword === newPassword) { setPwError("현재 비밀번호와 동일한 비밀번호로 변경할 수 없습니다."); return; }

    setPwLoading(true);

    // 현재 비밀번호 검증: 재로그인으로 확인
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: userInfo!.email,
      password: currentPassword,
    });

    if (signInErr) {
      setPwLoading(false);
      setPwError("현재 비밀번호가 올바르지 않습니다.");
      return;
    }

    // 새 비밀번호로 업데이트
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);

    if (updateErr) {
      setPwError(updateErr.message ?? "비밀번호 변경 중 오류가 발생했습니다.");
    } else {
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => onClose(), 1500);
    }
  };

  const providerLabel: Record<string, string> = {
    email: "이메일",
    kakao: "카카오",
    google: "구글",
    github: "GitHub",
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      sx={{
        alignItems: { xs: "flex-end", sm: "center" },
        "& .MuiDialog-paper": {
          m: { xs: 0, sm: 2 },
          width: "100%",
          borderRadius: { xs: "16px 16px 0 0", sm: 3 },
          maxHeight: { xs: "90vh", sm: "80vh" },
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 0.5,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        내 정보
        <IconButton size="small" onClick={onClose} aria-label="닫기">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Box>
        ) : userInfo ? (
          <Stack spacing={3}>
            {/* 프로필 카드 */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                p: 2,
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.07),
                border: "1px solid",
                borderColor: alpha(theme.palette.primary.main, 0.2),
              }}
            >
              <Avatar
                src={userInfo.imageUrl}
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: "primary.main",
                  fontSize: "1.4rem",
                  flexShrink: 0,
                }}
              >
                {userInfo.imageUrl ? null : <AccountCircleOutlined sx={{ fontSize: "2rem" }} />}
              </Avatar>
              <Box minWidth={0}>
                <Typography fontWeight={800} variant="h6" noWrap>
                  {userInfo.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {userInfo.email}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: "inline-block",
                    mt: 0.5,
                    px: 1,
                    py: 0.2,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.secondary.main, 0.15),
                    color: "secondary.dark",
                    fontWeight: 700,
                  }}
                >
                  {providerLabel[userInfo.provider] ?? userInfo.provider} 로그인
                </Typography>
              </Box>
            </Box>

            {/* 비밀번호 변경 — 이메일 로그인 전용 */}
            {isEmailProvider ? (
              <>
                <Divider />
                <Box>
                  <Stack direction="row" alignItems="center" spacing={0.75} mb={2}>
                    <LockOutlined sx={{ fontSize: "1rem", color: "text.secondary" }} />
                    <Typography variant="body2" fontWeight={700} color="text.secondary">
                      비밀번호 변경
                    </Typography>
                  </Stack>

                  <Stack spacing={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      label="현재 비밀번호"
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      sx={{ "& fieldset": { borderRadius: 1.5 } }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title={showCurrent ? "숨기기" : "보기"}>
                              <IconButton
                                size="small"
                                onClick={() => setShowCurrent((v) => !v)}
                                aria-label={showCurrent ? "비밀번호 숨기기" : "비밀번호 표시"}
                              >
                                {showCurrent ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="새 비밀번호"
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      sx={{ "& fieldset": { borderRadius: 1.5 } }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title={showNew ? "숨기기" : "보기"}>
                              <IconButton
                                size="small"
                                onClick={() => setShowNew((v) => !v)}
                                aria-label={showNew ? "비밀번호 숨기기" : "비밀번호 표시"}
                              >
                                {showNew ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="새 비밀번호 확인"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") void handlePasswordChange(); }}
                      sx={{ "& fieldset": { borderRadius: 1.5 } }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title={showConfirm ? "숨기기" : "보기"}>
                              <IconButton
                                size="small"
                                onClick={() => setShowConfirm((v) => !v)}
                                aria-label={showConfirm ? "비밀번호 숨기기" : "비밀번호 표시"}
                              >
                                {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      }}
                    />

                    {pwError && <Alert severity="error" sx={{ py: 0 }}>{pwError}</Alert>}
                    {pwSuccess && <Alert severity="success" sx={{ py: 0 }}>비밀번호가 변경되었습니다.</Alert>}

                    <Button
                      variant="contained"
                      fullWidth
                      disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}
                      onClick={() => void handlePasswordChange()}
                      sx={{ fontWeight: 700, textTransform: "none", borderRadius: 1.5 }}
                    >
                      {pwLoading ? <CircularProgress size={18} color="inherit" /> : "변경하기"}
                    </Button>
                  </Stack>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "action.hover",
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {providerLabel[userInfo.provider] ?? userInfo.provider} 로그인 계정은 비밀번호 변경이 지원되지 않습니다.
                </Typography>
              </Box>
            )}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            사용자 정보를 불러올 수 없습니다.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
