import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useAddFunds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch(api.user.balance.path, {
        method: api.user.balance.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to add funds");
      }
      return api.user.balance.responses[200].parse(await res.json());
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData([api.auth.me.path], updatedUser);
    },
  });
}
