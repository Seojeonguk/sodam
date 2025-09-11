import { Box, Button, Container, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import LoginApi from "../features/login/services/LoginApi";
import type { LoginRequestDto } from "../features/login/services/login.types";
import { useNavigate } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

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
      const refreshToken = res.data?.refreshToken;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);

      navigate("/transactions");
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
    // 현재 URL에서 accessToken 추출
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");

    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);

      navigate("/transactions");
    }
  }, [navigate]);

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
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleSubmit}
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
        </Box>
      </Box>
    </Container>
  );
}

export default LoginPage;
