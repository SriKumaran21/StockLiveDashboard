import React, { useState } from 'react';
import { useAddFunds } from '@/hooks/use-user';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Wallet, Loader2, IndianRupee } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: string | number;
}

export function AddFundsDialog({ isOpen, onClose, currentBalance }: Props) {
  const [amount, setAmount] = useState<string>('10000');
  const addFunds = useAddFunds();
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      toast({ title: 'Invalid amount', description: 'Please enter a valid positive amount', variant: 'destructive' });
      return;
    }
    
    try {
      await addFunds.mutateAsync(val);
      toast({ title: 'Funds Added', description: `Successfully added ${formatCurrency(val)} to your account.` });
      onClose();
    } catch (err: any) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 flex justify-between items-center bg-muted/30">
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" /> Add Funds
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-accent">
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-1 text-center bg-secondary/50 rounded-2xl p-4 border border-border/50">
            <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
            <p className="text-3xl font-display font-bold font-mono tracking-tight">{formatCurrency(Number(currentBalance))}</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Amount to Add (₹)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <IndianRupee className="h-5 w-5 text-muted-foreground" />
              </div>
              <input 
                type="number" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-background border-2 border-border text-lg font-mono rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200"
                placeholder="Enter amount"
                min="100"
                step="100"
                required
              />
            </div>
            
            <div className="flex gap-2 pt-2">
              {[1000, 5000, 10000, 50000].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset.toString())}
                  className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  +{formatNumberShort(preset)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={addFunds.isPending}
            className="w-full py-3.5 rounded-xl font-semibold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all duration-200 flex justify-center items-center gap-2"
          >
            {addFunds.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
            {addFunds.isPending ? 'Processing...' : 'Deposit Funds'}
          </button>
        </form>
      </div>
    </div>
  );
}

function formatNumberShort(num: number) {
  if (num >= 1000) return `${num/1000}k`;
  return num.toString();
}
