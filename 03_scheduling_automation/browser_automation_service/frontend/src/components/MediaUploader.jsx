import React from "react";

const MediaUploader = ({ onSelect }) => {
  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onSelect(file);
    }
  };

  return (
    <div className="mb-2">
      <input type="file" accept="image/*,video/*" onChange={handleChange} className="w-full" />
    </div>
  );
};

export default MediaUploader;
