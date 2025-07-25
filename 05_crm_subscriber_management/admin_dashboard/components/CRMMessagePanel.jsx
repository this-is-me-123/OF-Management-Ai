import React, { useState } from "react";
import { useSendMessage } from "../hooks/useSendMessage";

export const CRMMessagePanel = () => {
  const [username, setUsername] = useState("");
  const [tier, setTier] = useState("Standard");
  const [type, setType] = useState("Welcome");
  const { sendMessage, result } = useSendMessage();

  const handleSubmit = () => {
    sendMessage({ username, tier, message_type: type });
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl mb-2">Send CRM Message</h2>
      <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="mb-2 p-2 border w-full" />
      <select value={tier} onChange={e => setTier(e.target.value)} className="mb-2 p-2 border w-full">
        <option>Trial</option>
        <option>Standard</option>
        <option>VIP</option>
      </select>
      <select value={type} onChange={e => setType(e.target.value)} className="mb-2 p-2 border w-full">
        <option>Welcome</option>
        <option>Retention</option>
      </select>
      <button onClick={handleSubmit} className="bg-blue-600 text-white p-2 w-full rounded">Send</button>
      {result && <pre className="mt-2 bg-gray-100 p-2">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
};
