"use client";

import { useEffect, useState } from "react";

function greetingForHour(hour: number): string {
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

/**
 * Se calcula en el cliente porque depende de la hora local del usuario, no
 * de la del servidor (que en Vercel corre en UTC y daría un saludo
 * incorrecto la mayor parte del día).
 */
export function GreetingText({ firstName }: { firstName: string }) {
  const [greeting, setGreeting] = useState("Hola");

  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  return (
    <>
      {greeting}
      {firstName ? `, ${firstName}` : ""}
    </>
  );
}
