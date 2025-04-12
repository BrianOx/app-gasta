
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// This page will just redirect to the dashboard
const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return null;
};

export default Index;
