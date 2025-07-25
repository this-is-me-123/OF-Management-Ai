import { useState } from "react";
import axios from "axios";

export const useScheduledPosts = () => {
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    const res = await axios.get("http://localhost:5001/scheduled-posts");
    setPosts(res.data);
  };

  const addPost = async (postData) => {
    await axios.post("http://localhost:5001/scheduled-posts", postData);
    fetchPosts();
  };

  return { posts, fetchPosts, addPost };
};
