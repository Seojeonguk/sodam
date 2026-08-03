import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { restoreSession, setAccessToken } from "../../../shared/api/api";
import { supabase } from "../../../shared/lib/supabase";
import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";
import { sessionCache } from "../../../shared/lib/localCache";
import { guestMode } from "../../../shared/lib/guestMode";

function LoginPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { fetchAccountBooks } = useAccountBookContext();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const moveToDashboard = useCallback(async () => {
    await fetchAccountBooks();
    void navigate("/dashboard");
  }, [fetchAccountBooks, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(
          error.message ?? "로그인에 실패했습니다. 다시 시도해 주세요.",
        );
        return;
      }

      if (data.session) {
        setAccessToken(data.session.access_token);
        sessionCache.set(email);
      }

      await moveToDashboard();
    } catch (error: unknown) {
      setErrorMsg(
        error instanceof Error
          ? error.message
          : "로그인에 실패했습니다. 다시 시도해 주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestStart = async () => {
    guestMode.enable();
    await fetchAccountBooks();
    void navigate("/dashboard");
  };

  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: window.location.origin },
    });
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      if (!navigator.onLine && !sessionCache.get()) {
        if (isMounted) setIsLoading(false);
        return;
      }

      const restored = await restoreSession();

      if (!isMounted) return;

      if (restored) {
        try {
          await moveToDashboard();
          return;
        } catch (error) {
          console.error("Session restore failed", error);
        }
      }

      setIsLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [moveToDashboard]);

  if (isLoading) {
    return (
      <Container
        maxWidth="sm"
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Paper
          sx={{
            p: 4,
            width: "100%",
            maxWidth: 420,
            borderRadius: 4,
            textAlign: "center",
          }}
        >
          <Stack spacing={2} alignItems="center">
            <CircularProgress color="primary" />
            <Typography fontWeight={700}>
              로그인 상태를 확인하고 있어요.
            </Typography>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        <Box
          display="grid"
          gridTemplateColumns={{ xs: "1fr", md: "1.1fr 0.9fr" }}
          gap={{ xs: 3, md: 4 }}
          alignItems="stretch"
        >
          {/* 브랜딩 패널: 데스크톱 전용 */}
          <Paper
            elevation={0}
            sx={{
              p: { md: 5 },
              borderRadius: 5,
              minHeight: { md: 620 },
              display: { xs: "none", md: "flex" },
              flexDirection: "column",
              justifyContent: "space-between",
              border: "1px solid",
              borderColor: alpha(theme.palette.primary.main, 0.12),
              bgcolor: alpha(theme.palette.primary.main, 0.03),
            }}
          >
            <Stack spacing={3}>
              <Box>
                <Typography
                  variant="overline"
                  color="primary"
                  sx={{ letterSpacing: 2, fontWeight: 700 }}
                >
                  PERSONAL FINANCE SPACE
                </Typography>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  sx={{ mt: 1, mb: 2, maxWidth: 400, lineHeight: 1.2 }}
                >
                  가계부를 더 차분하고 선명하게.
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ maxWidth: 420 }}
                >
                  수입과 지출을 한눈에 정리하고, 계정별 흐름과 통계를 안정적으로
                  이어서 관리할 수 있는 개인 자산 공간입니다.
                </Typography>
              </Box>
              <Stack spacing={1.5}>
                {[
                  "유형과 카테고리를 빠르게 나눠서 거래를 정리합니다.",
                  "Supabase 인증으로 안전하고 빠른 로그인을 제공합니다.",
                  "데스크톱과 모바일 모두에서 같은 감각으로 이어집니다.",
                ].map((item) => (
                  <Stack
                    key={item}
                    direction="row"
                    spacing={1.5}
                    alignItems="flex-start"
                  >
                    <Box
                      sx={{
                        mt: 0.6,
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontWeight={500}
                    >
                      {item}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
            <Typography variant="caption" color="text.disabled">
              Sodam · 개인 자산 관리 서비스
            </Typography>
          </Paper>

          <Paper
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 5,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Box width="100%">
              {/* 모바일 전용 상단 브랜딩 */}
              <Box
                sx={{
                  display: { xs: "block", md: "none" },
                  mb: 3,
                  pb: 3,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                }}
              >
                <Typography
                  variant="h5"
                  fontWeight={800}
                  color="primary"
                  mb={0.5}
                >
                  Sodam
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  가계부를 더 차분하고 선명하게.
                </Typography>
              </Box>

              <Stack spacing={1} mb={4}>
                <Typography variant="h4">로그인</Typography>
                <Typography color="text.secondary">
                  계정에 다시 연결해서 오늘의 가계부 흐름을 이어가세요.
                </Typography>
              </Stack>

              <Box
                component="form"
                display="flex"
                flexDirection="column"
                gap={2}
                onSubmit={(e) => void handleSubmit(e)}
              >
                <Stack spacing={1.5}>
                  <Typography variant="body2" fontWeight={700}>
                    이메일
                  </Typography>
                  <TextField
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </Stack>

                <Stack spacing={1.5}>
                  <Typography variant="body2" fontWeight={700}>
                    비밀번호
                  </Typography>
                  <TextField
                    placeholder="비밀번호를 입력해 주세요."
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </Stack>

                {errorMsg ? <Alert severity="error">{errorMsg}</Alert> : null}

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 1 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "로그인 중..." : "로그인"}
                </Button>

                <Divider sx={{ my: 1.5 }}>또는</Divider>

                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "#FEE500",
                    color: "#2b2b2b",
                    "&:hover": { bgcolor: "#f2da00" },
                  }}
                  onClick={() => void handleKakaoLogin()}
                >
                  카카오로 계속하기
                </Button>

                <Button
                  variant="outlined"
                  color="inherit"
                  sx={{
                    bgcolor: "#ffffff",
                    borderColor: alpha(theme.palette.text.primary, 0.14),
                  }}
                  onClick={() => void handleGoogleLogin()}
                >
                  구글로 계속하기
                </Button>

                <Button
                  variant="text"
                  sx={{
                    mt: 1,
                    color: "secondary.dark",
                    "&:hover": {
                      backgroundColor: alpha(
                        theme.palette.secondary.main,
                        0.12,
                      ),
                    },
                  }}
                  onClick={() => void navigate("/signup")}
                >
                  회원가입
                </Button>

                <Divider sx={{ my: 0.5 }} />

                <Button
                  variant="text"
                  color="inherit"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.8rem",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.action.hover, 0.06),
                    },
                  }}
                  onClick={() => void handleGuestStart()}
                >
                  로그인 없이 둘러보기
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}

export default LoginPage;
