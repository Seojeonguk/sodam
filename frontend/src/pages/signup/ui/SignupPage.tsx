import { Box, Button, Container, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SignupApi from "../../../features/auth/api/SignupApi";
import type { SignupRequestDto } from "../../../features/auth/api/signup.types";

function SignupPage() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [errorMsg, setErrorMsg] = useState<string>("");

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg("");

        if (!email || !password || !name) {
            setErrorMsg("모든 필드를 입력해주세요.");
            return;
        }

        const signupRequestDto: SignupRequestDto = {
            email,
            password,
            name,
        };

        try {
            const res = await SignupApi.signup(signupRequestDto);
            if (res.code === "S-00000") { // Assuming successful code, adjust based on backend
                alert("회원가입이 완료되었습니다. 로그인해주세요.");
                navigate("/");
            } else {
                setErrorMsg(res.message || "회원가입에 실패했습니다.");
            }
        } catch (error: any) {
            // Error handling based on axios error structure from SignupApi
            const message = error.response?.data?.message || "회원가입 중 오류가 발생했습니다.";
            setErrorMsg(message);
        }
    };

    return (
        <Container maxWidth="xs">
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                minHeight="100vh"
            >
                <Typography variant="h5" mb={3}>
                    회원가입
                </Typography>

                <Box
                    component="form"
                    width="100%"
                    display="flex"
                    flexDirection="column"
                    gap={2}
                    onSubmit={(e) => void handleSubmit(e)}
                >
                    <TextField
                        label="이메일"
                        variant="outlined"
                        fullWidth
                        type="email"
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
                    <TextField
                        label="이름"
                        variant="outlined"
                        fullWidth
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <Typography color="error" variant="body2">{errorMsg}</Typography>

                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        sx={{ mt: 2 }}
                    >
                        가입하기
                    </Button>

                    <Button
                        variant="text"
                        fullWidth
                        onClick={() => navigate("/")}
                    >
                        로그인으로 돌아가기
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default SignupPage;
