import { useState } from "react";
import axios from "axios";

export const useSendMessage = () => {
  const [result, setResult] = useState(null);

  const sendMessage = async (data) => {
    try {
      const res = await axios.post("http://localhost:5001/send", data);
      setResult(res.data);
    } catch (e) {
      setResult({ error: e.message });
    }
  };

  return { sendMessage, result };
};
