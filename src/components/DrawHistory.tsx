import { ChitFund } from '@/types/chit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

interface DrawHistoryProps {
  chit: ChitFund;
}

export function DrawHistory({ chit }: DrawHistoryProps) {
  const getCurrencySymbol = (code: string): string => {
    const symbols: Record<string, string> = {
      INR: '₹', USD: '$', GBP: '£', EUR: '€',
      AED: 'د.إ', SGD: 'S$', AUD: 'A$', CAD: 'C$'
    };
    return symbols[code] || code;
  };

  const totalValue = chit.monthlyAmount * chit.totalMembers;

  if (chit.draws.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Draw History
          </CardTitle>
          <CardDescription>
            Past winners will appear here after draws are conducted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Trophy className="h-12 w-12 mb-4 opacity-30" />
            <p>No draws conducted yet</p>
            {chit.status === 'draft' && (
              <p className="text-sm mt-1">
                The chit needs all {chit.totalMembers} members to begin
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Draw History
        </CardTitle>
        <CardDescription>
          {chit.draws.length} of {chit.durationMonths} draws completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {chit.draws
            .sort((a, b) => b.month - a.month)
            .map((draw) => (
              <div
                key={draw.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                    {draw.month}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{draw.winnerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(draw.drawnAt), 'PPP')}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">
                    {getCurrencySymbol(chit.currency)}{totalValue.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Won</p>
                </div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
