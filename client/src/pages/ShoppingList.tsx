import { Card } from "@/components/ui/card";
import { CheckCircle2, Circle, Trash2, ShoppingBag } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ShoppingItem {
  id: string;
  name: string;
  section: string;
  checked: boolean;
}

export default function ShoppingList() {
  const { data: items = [] } = useQuery<ShoppingItem[]>({
    queryKey: ["/api/shopping-list"],
  });

  const toggleMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/shopping-list/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-list"] });
    },
  });

  const clearCheckedMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/shopping-list/checked");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shopping-list"] });
    },
  });

  const sections = items.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const hasCheckedItems = items.some(i => i.checked);

  return (
    <div className="h-[100dvh] bg-background pt-16 pb-24 px-4 overflow-y-auto">
      <div className="max-w-md mx-auto pt-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground mb-1">Groceries</h1>
            <p className="text-muted-foreground">{items.length} items to buy</p>
          </div>
          {hasCheckedItems && (
            <button
              onClick={() => clearCheckedMutation.mutate()}
              className="text-sm font-medium text-destructive flex items-center gap-1 bg-destructive/10 px-3 py-1.5 rounded-full hover:bg-destructive/20 transition-colors"
              data-testid="button-clear-checked"
            >
              <Trash2 size={14} /> Clear checked
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 mt-12 border-2 border-dashed border-border rounded-3xl">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <ShoppingBag size={24} className="text-muted-foreground opacity-50" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2" data-testid="text-empty-list">Your list is empty</h2>
            <p className="text-muted-foreground">Add ingredients from your Cookbook to start shopping.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(sections).sort(([a], [b]) => a.localeCompare(b)).map(([section, sectionItems]) => (
              <div key={section} className="mb-6">
                <h2 className="text-lg font-bold mb-3 text-foreground flex items-center gap-2">
                  {section}
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                    {sectionItems.length}
                  </span>
                </h2>
                <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-card divide-y divide-border">
                  {sectionItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleMutation.mutate(item.id)}
                      className="p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors cursor-pointer group"
                      data-testid={`item-${item.id}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {item.checked ? (
                          <CheckCircle2 className="text-primary fill-primary/20" size={20} />
                        ) : (
                          <Circle className="text-muted-foreground group-hover:text-primary transition-colors" size={20} />
                        )}
                      </div>
                      <span className={`text-foreground transition-all ${item.checked ? 'line-through opacity-40' : ''}`}>
                        {item.name}
                      </span>
                    </div>
                  ))}
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
