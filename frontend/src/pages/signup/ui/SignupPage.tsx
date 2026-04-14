import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import SignupApi from "../../../features/auth/api/SignupApi";
import type { SignupRequestDto } from "../../../features/auth/api/signup.types";

function SignupPage() {
  const theme = useTheme();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email || !password || !name) {
      setErrorMsg("모든 필드를 입력해 주세요.");
      return;
    }

    const signupRequestDto: SignupRequestDto = {
      email,
      password,
      name,
    };

    try {
      const res = await SignupApi.signup(signupRequestDto);
      if (res.code === "S-00000") {
        alert("회원가입이 완료되었습니다. 로그인해 주세요.");
        navigate("/");
      } else {
        setErrorMsg(res.message || "회원가입에 실패했습니다.");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message || "회원가입 중 오류가 발생했습니다.";
      setErrorMsg(message);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", py: 6 }}>
      <Container maxWidth="sm">
        <Paper
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 5,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: "auto -40px -60px auto",
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: alpha(theme.palette.secondary.light, 0.55),
              filter: "blur(16px)",
            }}
          />
          <Stack spacing={1} mb={4} position="relative">
            <Typography variant="overline" color="text.secondary">
              CREATE ACCOUNT
            </Typography>
            <Typography variant="h4">회원가입</Typography>
            <Typography color="text.secondary">
              가계부를 함께 쓰기 위한 기본 정보를 입력해 주세요.
            </Typography>
          </Stack>

          <Box
            component="form"
            width="100%"
            display="flex"
            flexDirection="column"
            gap={2}
            position="relative"
            onSubmit={(e) => void handleSubmit(e)}
          >
            <TextField
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              label="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            {errorMsg ? <Alert severity="error">{errorMsg}</Alert> : null}

            <Button type="submit" variant="contained" color="primary" sx={{ mt: 1 }}>
              가입하기
            </Button>

            <Button variant="text" onClick={() => navigate("/")}>
              로그인으로 돌아가기
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default SignupPage;
