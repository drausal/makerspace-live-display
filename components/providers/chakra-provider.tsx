"use client";

import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ClientOnly } from "@/components/ClientOnly";

interface ProvidersProps {
  children: React.ReactNode;
}

export function ChakraUIProvider({ children }: ProvidersProps) {
  return (
    <ClientOnly>
      <ChakraProvider value={defaultSystem}>
        {children}
      </ChakraProvider>
    </ClientOnly>
  );
}
