import { useState } from "react";
import { Container, TextField, Button, Typography } from "@mui/material";
import userStore from "../store/userStore";
import { useTranslation } from "react-i18next";
import { observer } from "mobx-react-lite";

const Login = observer(() => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { t, i18n } = useTranslation();

    const handleLogin = async () => {
        await userStore.login(email, password);
    };

    return (
        <Container maxWidth="sm">
            <Typography variant="h4">Login</Typography>
            <TextField fullWidth label="Email" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} />
            <TextField fullWidth label="Password" type="password" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} />
            <Button fullWidth variant="contained" color="primary" onClick={handleLogin}>
                Login
            </Button>
            <Typography variant="h6">{t("Welcome")}</Typography>
            <Button onClick={() => i18n.changeLanguage("vi")}>🇻🇳 Tiếng Việt</Button>
            <Button onClick={() => i18n.changeLanguage("en")}>🇬🇧 English</Button>
        </Container>
    );
});

export default Login;

