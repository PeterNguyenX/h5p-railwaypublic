import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import Link from '@mui/material/Link';

const Navbar = () => {
    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    H5P Creator
                </Typography>
                <Button color="inherit" component={Link} href="/dashboard">Dashboard</Button>
                <Button color="inherit" component={Link} href="/login">Login</Button>
            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
