import { Box, Button, Container, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import LoginApi from "../../../features/auth/api/LoginApi";
import type { LoginRequestDto } from "../../../features/auth/api/login.types";
import accountBookApi from "../../../entities/accountbook/api/accountBookApi";
import { useNavigate } from "react-router-dom";
import { useAccountBookContext } from "../../../entities/accountbook/model/AccountBookContext";

function LoginPage() {
  const { fetchAccountBooks } = useAccountBookContext();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const loginRequestDto: LoginRequestDto = {
      email,
      password,
    };

    const res = await LoginApi.login(loginRequestDto);
    if (res.code !== "S-00000") {
      const message = res.message;
      setErrorMsg(message);
    } else {
      const accessToken = res.data?.accessToken;

      localStorage.setItem("accessToken", accessToken);

      await fetchAccountBooks();

      void navigate("/dashboard");
    }
  };

  const handleKakaoLoginBtn = (e: React.FormEvent) => {
    e.preventDefault();

    window.location.href = "https://junguk7880.site/oauth2/authorization/kakao";
  };

  const handleGoogleLoginBtn = (e: React.FormEvent) => {
    e.preventDefault();

    window.location.href =
      "https://junguk7880.site/oauth2/authorization/google";
  };

  useEffect(() => {
    const checkAuth = async () => {
      // 1. URL 파라미터에서 토큰 확인 (OAuth 리다이렉트)
      const params = new URLSearchParams(window.location.search);
      const urlAccessToken = params.get("accessToken");

      if (urlAccessToken) {
        console.debug(`parameter access token : ${urlAccessToken}`);
        localStorage.setItem("accessToken", urlAccessToken);
        await fetchAccountBooks();
        // URL 파라미터 제거 (선택사항, 깔끔한 URL을 위해)
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // 2. 로컬 스토리지에서 토큰 확인
      const savedAccessToken = localStorage.getItem("accessToken");
      console.debug(`saved access token : ${savedAccessToken}`);

      if (savedAccessToken) {
        try {
          // 3. 토큰 유효성 검증 (API 호출)
          // accountBookApi.getAccountBooks() 같은 보호된 API를 호출하여 토큰이 유효한지 확인
          // 만료되었다면 api.ts의 interceptor가 refresh를 시도할 것임
          await accountBookApi.getAccountBooks();

          // 성공 시 대시보드로 이동
          void navigate("/dashboard");
          return; // 이동하므로 로딩 상태 해제 불필요 (언마운트됨)
        } catch (error) {
          console.error("Auto login failed:", error);
          // 실패 시 (refresh도 실패한 경우) 토큰 제거 및 로그인 페이지 유지
          localStorage.removeItem("accessToken");
        }
      }

      // 토큰이 없거나 유효하지 않은 경우 로딩 종료 -> 로그인 폼 표시
      setIsLoading(false);
    };

    void checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <Container maxWidth="xs" sx={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography>로그인 확인 중...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="h5" mb={3}>
          로그인
        </Typography>

        <Box
          component="form"
          width="100%"
          display="flex"
          flexDirection="column"
          gap={2}
        >
          <TextField
            label="이메일"
            variant="outlined"
            fullWidth
            helperText=""
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="비밀번호"
            type="password"
            variant="outlined"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Typography>{errorMsg}</Typography>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={(e) => void handleSubmit(e)}
          >
            로그인
          </Button>

          <Button
            variant="contained"
            color="primary"
            sx={{ backgroundColor: "yellow" }}
            fullWidth
            onClick={handleKakaoLoginBtn}
          >
            카카오 로그인
          </Button>

          <Button
            variant="contained"
            color="primary"
            sx={{ backgroundColor: "white" }}
            fullWidth
            onClick={handleGoogleLoginBtn}
          >
            구글 로그인
          </Button>

          <Button
            variant="text"
            fullWidth
            onClick={() => void navigate("/signup")}
          >
            회원가입
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

export default LoginPage;
