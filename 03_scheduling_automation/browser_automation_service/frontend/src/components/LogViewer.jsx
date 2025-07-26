import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function LogViewer() {
  const { folder, file } = useParams();
  const [content, setContent] = useState(null);
  const [type, setType] = useState(null);

  useEffect(() => {
    const ext = file.split(".").pop();
    setType(ext);

    fetch(`/dashboard/logs/${folder}/${file}`)
      .then(res => ext === "png" ? res.blob() : res.text())
      .then(data => {
        if (ext === "png") {
          setContent(URL.createObjectURL(data));
        } else {
          setContent(data);
        }
      });
  }, [folder, file]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Viewing: {file}</h2>
      {type === "png" && content && (
        <img src={content} alt="screenshot" className="rounded shadow max-w-full" />
      )}
      {type === "html" && content && (
        <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
          {content.slice(0, 10000)}
        </pre>
      )}
    </div>
  );
}
