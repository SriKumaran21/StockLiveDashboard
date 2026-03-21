import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/routes';
import { formatCurrency, cn } from '@/lib/format';
import { X, Smartphone, Building2, CreditCard, ChevronRight, CheckCircle2, Loader2, Shield, Lock } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: string | number;
}

type Method = 'upi' | 'netbanking' | 'card';
type Step = 'amount' | 'method' | 'details' | 'processing' | 'success';

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000, 50000, 100000];

const BANKS = [
  { id: 'sbi', name: 'State Bank of India', logo: '🏦' },
  { id: 'hdfc', name: 'HDFC Bank', logo: '🏦' },
  { id: 'icici', name: 'ICICI Bank', logo: '🏦' },
  { id: 'axis', name: 'Axis Bank', logo: '🏦' },
  { id: 'kotak', name: 'Kotak Mahindra', logo: '🏦' },
  { id: 'other', name: 'Other Banks', logo: '🏦' },
];

export function AddFundsDialog({ isOpen, onClose, currentBalance }: Props) {
  const [step, setStep] = useState<Step>('amount');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<Method>('upi');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (amt: number) => {
      const res = await fetch(api.user.balance.path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      setStep('success');
    },
  });

  const handleClose = () => {
    setStep('amount');
    setAmount('');
    setUpiId('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setSelectedBank('');
    onClose();
  };

  const handleProceed = async () => {
    if (step === 'amount') {
      if (!amount || Number(amount) < 100) return;
      setStep('method');
    } else if (step === 'method') {
      setStep('details');
    } else if (step === 'details') {
      setStep('processing');
      // Simulate processing delay
      await new Promise(r => setTimeout(r, 2000));
      mutation.mutate(Number(amount));
    }
  };

  const formatCard = (val: string) => {
    return val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
  };

  const formatExpiry = (val: string) => {
    return val.replace(/\D/g, '').replace(/^(.{2})/, '$1/').slice(0, 5);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-base">Add Funds</h2>
            <p className="text-xs text-muted-foreground">
              Current balance: <span className="font-mono font-semibold text-foreground">{formatCurrency(Number(currentBalance))}</span>
            </p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        {step !== 'processing' && step !== 'success' && (
          <div className="flex px-6 pt-4 gap-2">
            {(['amount', 'method', 'details'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                  step === s ? "bg-primary text-black" :
                  ['amount','method','details'].indexOf(step) > i ? "bg-green-500 text-black" : "bg-secondary text-muted-foreground"
                )}>{i + 1}</div>
                <div className={cn("h-px flex-1", i < 2 ? "bg-border" : "hidden")} />
              </div>
            ))}
          </div>
        )}

        <div className="p-6">
          {/* Step 1 — Amount */}
          {step === 'amount' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Enter Amount</label>
                <div className="relative mt-2">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground">₹</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl pl-9 pr-4 py-3.5 text-xl font-bold font-mono focus:outline-none focus:border-primary transition-colors"
                    min="100"
                  />
                </div>
                {amount && Number(amount) < 100 && (
                  <p className="text-xs text-red-500 mt-1">Minimum deposit is ₹100</p>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Select</p>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_AMOUNTS.map(a => (
                    <button key={a} onClick={() => setAmount(a.toString())}
                      className={cn(
                        "py-2.5 rounded-xl text-sm font-semibold border transition-all",
                        amount === a.toString()
                          ? "bg-primary text-black border-primary"
                          : "bg-secondary border-border hover:border-primary/50 text-foreground"
                      )}>
                      {a >= 100000 ? `₹${a/100000}L` : a >= 1000 ? `₹${a/1000}K` : `₹${a}`}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleProceed}
                disabled={!amount || Number(amount) < 100}
                className="w-full py-3.5 bg-primary text-black font-bold rounded-xl hover:opacity-90 disabled:opacity-30 transition-all flex items-center justify-center gap-2">
                Proceed <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2 — Payment Method */}
          {step === 'method' && (
            <div className="space-y-4">
              <p className="text-sm font-semibold">Choose Payment Method</p>
              <p className="text-xs text-muted-foreground -mt-2">Adding <span className="text-primary font-bold font-mono">₹{Number(amount).toLocaleString('en-IN')}</span></p>

              {[
                { id: 'upi' as Method, icon: Smartphone, label: 'UPI', desc: 'GPay, PhonePe, Paytm, BHIM' },
                { id: 'netbanking' as Method, icon: Building2, label: 'Net Banking', desc: 'All major banks supported' },
                { id: 'card' as Method, icon: CreditCard, label: 'Debit / Credit Card', desc: 'Visa, Mastercard, RuPay' },
              ].map(({ id, icon: Icon, label, desc }) => (
                <button key={id} onClick={() => setMethod(id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left",
                    method === id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                    method === id ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground")}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <div className={cn("w-4 h-4 rounded-full border-2 flex-shrink-0",
                    method === id ? "border-primary bg-primary" : "border-border")}>
                    {method === id && <div className="w-full h-full rounded-full bg-black scale-50" />}
                  </div>
                </button>
              ))}

              <button onClick={handleProceed}
                className="w-full py-3.5 bg-primary text-black font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 3 — Details */}
          {step === 'details' && (
            <div className="space-y-4">
              <p className="text-sm font-semibold">
                {method === 'upi' ? 'Enter UPI ID' : method === 'netbanking' ? 'Select Bank' : 'Card Details'}
              </p>

              {method === 'upi' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="yourname@upi"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {['@okaxis', '@okicici', '@ybl', '@paytm', '@upi'].map(suffix => (
                      <button key={suffix} onClick={() => setUpiId(prev => prev.split('@')[0] + suffix)}
                        className="text-xs px-3 py-1.5 bg-secondary rounded-lg hover:bg-border transition-colors">
                        {suffix}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {method === 'netbanking' && (
                <div className="grid grid-cols-2 gap-2">
                  {BANKS.map(bank => (
                    <button key={bank.id} onClick={() => setSelectedBank(bank.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        selectedBank === bank.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                      )}>
                      <div className="text-lg mb-1">{bank.logo}</div>
                      <p className="text-xs font-semibold">{bank.name}</p>
                    </button>
                  ))}
                </div>
              )}

              {method === 'card' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Card Number</label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={e => setCardNumber(formatCard(e.target.value))}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-primary transition-colors mt-1.5"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Expiry</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-primary transition-colors mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">CVV</label>
                      <input
                        type="password"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.slice(0, 3))}
                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-primary transition-colors mt-1.5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Name on Card</label>
                    <input
                      type="text"
                      placeholder="JOHN DOE"
                      value={cardName}
                      onChange={e => setCardName(e.target.value.toUpperCase())}
                      className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:border-primary transition-colors mt-1.5"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-secondary rounded-xl px-3 py-2.5">
                <Lock className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span>256-bit SSL encrypted · Your data is secure</span>
              </div>

              <button onClick={handleProceed}
                className="w-full py-3.5 bg-primary text-black font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2">
                Pay ₹{Number(amount).toLocaleString('en-IN')} <Shield className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Processing */}
          {step === 'processing' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div>
                <p className="font-display font-bold text-base">Processing Payment</p>
                <p className="text-sm text-muted-foreground mt-1">Please wait while we verify your payment…</p>
              </div>
              <div className="space-y-2 text-left bg-secondary rounded-xl p-4">
                {['Connecting to payment gateway', 'Verifying transaction', 'Crediting to account'].map((s, i) => (
                  <div key={s} className="flex items-center gap-2 text-xs">
                    <div className={cn("w-1.5 h-1.5 rounded-full", i === 0 ? "bg-primary animate-pulse" : "bg-border")} />
                    <span className={i === 0 ? "text-foreground" : "text-muted-foreground"}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="font-display font-bold text-xl text-green-500">
                  ₹{Number(amount).toLocaleString('en-IN')} Added!
                </p>
                <p className="text-sm text-muted-foreground mt-1">Your funds are ready to invest</p>
              </div>
              <div className="bg-secondary rounded-xl p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount added</span>
                  <span className="font-mono font-bold text-green-500">+₹{Number(amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">New balance</span>
                  <span className="font-mono font-bold">{formatCurrency(Number(currentBalance) + Number(amount))}</span>
                </div>
              </div>
              <button onClick={handleClose}
                className="w-full py-3.5 bg-primary text-black font-bold rounded-xl hover:opacity-90 transition-all">
                Start Investing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
