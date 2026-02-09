"use client";

import { useAuth } from "@/contexts/auth-context";
import React, { useEffect, useState } from "react";
import { fetchReferenceData } from "@/lib/api-client";

export function DashboardGreeting() {
  const { user } = useAuth();
  const [dbUserName, setDbUserName] = useState<string | null>(null);

  useEffect(() => {
    async function getDbUserName() {
      if (!user?.email) return;
      try {
        const users = await fetchReferenceData("users");
        const dbUser = users.find((u: any) => u.email === user.email);
        setDbUserName(dbUser ? dbUser.name : null);
      } catch (err) {
        setDbUserName(null);
      }
    }
    getDbUserName();
  }, [user?.email]);

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = dbUserName || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "User";
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 18) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
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