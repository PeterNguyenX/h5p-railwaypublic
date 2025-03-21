import { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
    const [projects, setProjects] = useState<{ id: number; title: string }[]>([]);

    useEffect(() => {
        axios.get<{ id: number; title: string }[]>("/api/projects").then((res) => setProjects(res.data));
    }, []);

    return (
        <div>
            <h2>My Projects</h2>
            {projects.map((p) => (
                <div key={p.id}>
                    <h4>{p.title}</h4>
                    <button>Open</button>
                </div>
            ))}
        </div>
    );
};

export default Dashboard;
