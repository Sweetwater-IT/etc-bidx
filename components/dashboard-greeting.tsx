"use client";

import { useAuth } from "@/contexts/auth-context";
import React from "react";

export function DashboardGreeting() {
  const { user } = useAuth();

  // Try to get the user's name, fallback to email or 'User'
  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "User";

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${userName}`;
    if (hour < 18) return `Good afternoon, ${userName}`;
    return `Good evening, ${userName}`;
  };

  return (
    <>
      <p className="text-muted-foreground text-sm">
        {new Date().toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>
      <h2 className="text-2xl font-semibold">{getGreeting()}</h2>
    </>
  );
} 