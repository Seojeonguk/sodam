import { useEffect, useState } from "react";
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
import LoginApi from "../../../features/auth/api/LoginApi";
import accountBookApi from "../../../entities/accountbook/api/accountBookApi";
import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";

function LoginPage() {
  const theme = useTheme();
  const { fetchAccountBooks } = useAccountBookContext();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = await LoginApi.login({
        email,
        password,
      });

      const accessToken = data.data.accessToken;
      localStorage.setItem("accessToken", accessToken);
      await fetchAccountBooks();
      void navigate("/dashboard");
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : "로그인에 실패했습니다.");
    }
  };

  const handleKakaoLoginBtn = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "https://junguk7880.site/oauth2/authorization/kakao";
  };

  const handleGoogleLoginBtn = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = "https://junguk7880.site/oauth2/authorization/google";
  };

  useEffect(() => {
    const checkAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const urlAccessToken = params.get("accessToken");

      if (urlAccessToken) {
        localStorage.setItem("accessToken", urlAccessToken);
        await fetchAccountBooks();
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const savedAccessToken = localStorage.getItem("accessToken");

      if (savedAccessToken) {
        try {
          await accountBookApi.getAccountBooks();
          void navigate("/dashboard");
          return;
        } catch (error) {
          console.error("Auto login failed:", error);
          localStorage.removeItem("accessToken");
        }
      }

      setIsLoading(false);
    };

    void checkAuth();
  }, [fetchAccountBooks, navigate]);

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
          <Paper
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: 5,
              minHeight: { md: 620 },
              position: "relative",
              overflow: "hidden",
              background: `linear-gradient(145deg, ${alpha(
                theme.palette.primary.light,
                0.88,
              )} 0%, ${alpha(theme.palette.primary.main, 0.72)} 50%, ${alpha(
                theme.palette.secondary.light,
                0.84,
              )} 100%)`,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: -80,
                right: -40,
                width: 240,
                height: 240,
                borderRadius: "50%",
                backgroundColor: alpha("#ffffff", 0.26),
                filter: "blur(10px)",
              }}
            />
            <Stack
              spacing={3}
              justifyContent="space-between"
              sx={{ position: "relative", height: "100%" }}
            >
              <Box>
                <Typography variant="overline" sx={{ letterSpacing: 2 }}>
                  PERSONAL FINANCE SPACE
                </Typography>
                <Typography variant="h2" sx={{ mt: 1, mb: 2, maxWidth: 420 }}>
                  가계부를 더 차분하고 선명하게.
                </Typography>
                <Typography variant="body1" sx={{ maxWidth: 460 }}>
                  지금의 부드러운 민트와 핑크 톤은 그대로 두고, 기록과 통계를
                  한눈에 정리해 주는 가계부 경험을 만들었습니다.
                </Typography>
              </Box>

              <Stack spacing={2.5}>
                {[
                  "한 화면에서 수입, 지출, 카테고리를 빠르게 확인",
                  "부드러운 컬러 대비로 오래 봐도 부담 없는 인터페이스",
                  "모바일과 데스크톱 모두 안정적인 간격과 정보 밀도",
                ].map((item) => (
                  <Paper
                    key={item}
                    sx={{
                      p: 2,
                      borderRadius: 3,
                      bgcolor: alpha("#ffffff", 0.48),
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <Typography fontWeight={700}>{item}</Typography>
                  </Paper>
                ))}
              </Stack>
            </Stack>
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
              <Stack spacing={1} mb={4}>
                <Typography variant="h4">로그인</Typography>
                <Typography color="text.secondary">
                  반가워요. 계정에 접속해서 오늘의 가계부를 이어서 관리해보세요.
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
                  />
                </Stack>

                <Stack spacing={1.5}>
                  <Typography variant="body2" fontWeight={700}>
                    비밀번호
                  </Typography>
                  <TextField
                    placeholder="비밀번호를 입력해 주세요"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Stack>

                {errorMsg ? <Alert severity="error">{errorMsg}</Alert> : null}

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ mt: 1 }}
                >
                  로그인
                </Button>

                <Divider sx={{ my: 1.5 }}>또는</Divider>

                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "#FEE500",
                    color: "#2b2b2b",
                    "&:hover": { bgcolor: "#f2da00" },
                  }}
                  onClick={handleKakaoLoginBtn}
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
                  onClick={handleGoogleLoginBtn}
                >
                  구글로 계속하기
                </Button>

                <Button
                  variant="text"
                  sx={{
                    mt: 1,
                    color: "secondary.dark",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.secondary.main, 0.12),
                    },
                  }}
                onClick={() => {
                  void navigate("/signup");
                }}
                >
                  회원가입
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
