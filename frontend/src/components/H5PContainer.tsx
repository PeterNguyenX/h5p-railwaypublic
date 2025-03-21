import { useEffect, useState } from "react";
import H5PPlayer from "react-h5p";

const H5PContainer = () => {
    const [h5pJson, setH5pJson] = useState("");

    useEffect(() => {
        fetch("/api/h5p/get-template")
            .then((res) => res.json())
            .then((data) => setH5pJson(data));
    }, []);

    return (
        <div>
            <h3>H5P Editor</h3>
            {h5pJson && <H5PPlayer h5pJson={h5pJson} />}
        </div>
    );
};

export default H5PContainer;
