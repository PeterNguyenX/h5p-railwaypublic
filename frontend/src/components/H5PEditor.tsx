import { useEffect, useState } from "react";
// Import H5PPlayer from the declared module
import H5PPlayer from "react-h5p"; 
import { Container, Typography } from "@mui/material";

const H5PEditor = () => {
    const [h5pJson, setH5pJson] = useState("");

    useEffect(() => {
        fetch("/api/h5p/get-template")
            .then((res) => res.json())
            .then((data) => setH5pJson(data));
    }, []);

    return (
        <Container>
            <Typography variant="h5">H5P Editor</Typography>
            {h5pJson && <H5PPlayer h5pJson={h5pJson} />}
        </Container>
    );
};

export default H5PEditor;
