import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Coins, Users, Calendar, Crown, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { AddMemberDialog } from '@/components/AddMemberDialog';
import { api } from '@/lib/api';
import { ChitFund } from '@/types/chit';

export default function JoinChit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [chit, setChit] = useState<ChitFund | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  const loadChit = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getChit(id);
      setChit(data);
    } catch (error) {
      console.error('Failed to load chit:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChit();
  }, [id]);

  const getCurrencySymbol = (code: string): string => {
    const symbols: Record<string, string> = {
      INR: '₹', USD: '$', GBP: '£', EUR: '€',
      AED: 'د.إ', SGD: 'S$', AUD: 'A$', CAD: 'C$'
    };
    return symbols[code] || code;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="animate-pulse space-y-6 max-w-lg mx-auto">
            <div className="h-8 bg-muted rounded w-1/2" />
            <div className="h-48 bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (!chit) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <Card className="max-w-md mx-auto text-center py-12">
            <CardHeader>
              <CardTitle>Chit/Kuri Not Found</CardTitle>
              <CardDescription>
                This invite link is invalid or the chit fund/kuri no longer exists.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const organizer = chit.members.find(m => m.id === chit.organizerId);
  const totalValue = chit.monthlyAmount * chit.totalMembers;
  const spotsLeft = chit.totalMembers - chit.members.length;
  const canJoin = chit.status === 'draft' && spotsLeft > 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-lg mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Coins className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">{chit.name}</CardTitle>
            {chit.description && (
              <CardDescription>{chit.description}</CardDescription>
            )}
            <Badge
              variant="outline"
              className={
                chit.status === 'draft'
                  ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 w-fit mx-auto'
                  : chit.status === 'active'
                  ? 'bg-green-500/10 text-green-500 border-green-500/20 w-fit mx-auto'
                  : 'bg-muted text-muted-foreground border-muted w-fit mx-auto'
              }
            >
              {chit.status.charAt(0).toUpperCase() + chit.status.slice(1)}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Chit Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Monthly</p>
                <p className="text-lg font-bold">
                  {getCurrencySymbol(chit.currency)}{chit.monthlyAmount.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground">Total Pot</p>
                <p className="text-lg font-bold text-primary">
                  {getCurrencySymbol(chit.currency)}{totalValue.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Members</p>
                </div>
                <p className="text-lg font-bold">{chit.members.length}/{chit.totalMembers}</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Duration</p>
                </div>
                <p className="text-lg font-bold">{chit.durationMonths} months</p>
              </div>
            </div>

            {/* Organizer */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Crown className="h-4 w-4 text-yellow-500" />
              <span>Organized by <span className="font-medium text-foreground">{organizer?.name}</span></span>
            </div>

            {/* Join CTA */}
            {canJoin ? (
              <div className="space-y-3">
                <p className="text-sm text-center text-muted-foreground">
                  {spotsLeft} spot{spotsLeft > 1 ? 's' : ''} remaining
                </p>
                <Button className="w-full" size="lg" onClick={() => setJoinDialogOpen(true)}>
                  <UserPlus className="mr-2 h-5 w-5" />
                  Join This Chit Fund/Kuri
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  {chit.status !== 'draft'
                    ? 'This chit fund/kuri is already active and no longer accepting new members.'
                    : 'This chit fund/kuri is full.'}
                </p>
                <Button variant="outline" className="mt-3" onClick={() => navigate(`/chit/${chit.id}`)}>
                  View Details
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {id && (
        <AddMemberDialog
          open={joinDialogOpen}
          onOpenChange={setJoinDialogOpen}
          chitId={id}
          onSuccess={loadChit}
        />
      )}
    </div>
  );
}
