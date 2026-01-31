import { Link } from 'react-router-dom';
import { Coins } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">ChitFund</h1>
            <p className="text-xs text-muted-foreground -mt-1">Digital Chit Management</p>
          </div>
        </Link>
      </div>
    </header>
  );
}
