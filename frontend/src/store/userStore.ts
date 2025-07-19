import { makeAutoObservable } from "mobx";
import axios from "axios";

class UserStore {
    user = null;
    token = localStorage.getItem("token") || "";

    constructor() {
        makeAutoObservable(this);
    }

    async login(username: string, password: string) {
        const res = await axios.post<{ token: string }>("/api/auth/login", { username, password });
        this.token = res.data.token;
        localStorage.setItem("token", res.data.token);
    }
}

export default new UserStore();
