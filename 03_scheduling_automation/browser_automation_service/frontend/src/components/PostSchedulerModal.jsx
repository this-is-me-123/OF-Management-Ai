import React, { useState } from "react";
import { useScheduledPosts } from "../hooks/useScheduledPosts";
import MediaUploader from "./MediaUploader";

export const PostSchedulerModal = ({ date, onClose }) => {
  const { addPost } = useScheduledPosts();
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [media, setMedia] = useState(null);

  const handleSubmit = () => {
    addPost({
      datetime: date,
      caption,
      tags: tags.split(","),
      fileName: media ? media.name : null,
    });
    onClose();
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-40 flex justify-center items-center">
      <div className="bg-white p-4 rounded shadow w-96">
        <h3 className="text-lg mb-2">Schedule New Post</h3>
        <p className="text-sm mb-2">Scheduled for: {date.toString()}</p>
        <input
          className="border p-2 w-full mb-2"
          placeholder="Caption"
          value={caption}
          onChange={e => setCaption(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-2"
          placeholder="Tags (comma-separated)"
          value={tags}
          onChange={e => setTags(e.target.value)}
        />
        <MediaUploader onSelect={setMedia} />
        <div className="flex justify-between">
          <button onClick={handleSubmit} className="bg-blue-600 text-white p-2 px-4 rounded">Save</button>
          <button onClick={onClose} className="bg-gray-300 text-black p-2 px-4 rounded">Cancel</button>
        </div>
      </div>
    </div>
  );
};
