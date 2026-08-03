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
import { supabase } from "../../../shared/lib/supabase";

function SignupPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!email || !password || !name) {
      setErrorMsg("모든 필드를 입력해 주세요.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      setErrorMsg(error.message ?? "회원가입 중 오류가 발생했습니다.");
      return;
    }

    // 이메일 확인이 필요한 경우 안내 메시지 표시
    setSuccessMsg(
      "가입이 완료되었습니다. 이메일 확인 링크를 클릭한 후 로그인해 주세요.",
    );
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
            <Typography variant="overline" color="text.secondary">CREATE ACCOUNT</Typography>
            <Typography variant="h4">회원가입</Typography>
            <Typography color="text.secondary">
              가계부를 시작하기 위한 기본 정보를 입력해 주세요.
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
            {successMsg ? <Alert severity="success">{successMsg}</Alert> : null}

            {!successMsg && (
              <Button type="submit" variant="contained" color="primary" sx={{ mt: 1 }}>
                가입하기
              </Button>
            )}

            <Button variant="text" onClick={() => void navigate("/")}>
              로그인으로 돌아가기
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default SignupPage;
