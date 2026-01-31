import { ChitFund, CreateChitPayload, AddMemberPayload, Member, DrawResult } from '@/types/chit';

// Configure this to point to your FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// For MVP, we'll use localStorage as a mock backend
// Replace these with actual API calls when backend is ready

const STORAGE_KEY = 'chitfunds_data';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function getStoredChits(): ChitFund[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function saveChits(chits: ChitFund[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chits));
}

export const api = {
  // Chit Fund operations
  async getChits(): Promise<ChitFund[]> {
    // TODO: Replace with actual API call
    // return fetch(`${API_BASE_URL}/api/chits`).then(r => r.json());
    return getStoredChits();
  },

  async getChit(id: string): Promise<ChitFund | null> {
    // TODO: Replace with actual API call
    // return fetch(`${API_BASE_URL}/api/chits/${id}`).then(r => r.json());
    const chits = getStoredChits();
    return chits.find(c => c.id === id) || null;
  },

  async createChit(payload: CreateChitPayload): Promise<ChitFund> {
    // TODO: Replace with actual API call
    // return fetch(`${API_BASE_URL}/api/chits`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // }).then(r => r.json());

    const organizerId = generateId();
    const newChit: ChitFund = {
      id: generateId(),
      name: payload.name,
      description: payload.description,
      monthlyAmount: payload.monthlyAmount,
      currency: payload.currency,
      totalMembers: payload.totalMembers,
      durationMonths: payload.durationMonths,
      currentMonth: 0,
      organizerId,
      organizerWinsFirst: payload.organizerWinsFirst,
      members: [{
        id: organizerId,
        name: payload.organizerName,
        email: payload.organizerEmail,
        country: payload.organizerCountry,
        hasWon: false
      }],
      draws: [],
      status: 'draft',
      createdAt: new Date().toISOString()
    };

    const chits = getStoredChits();
    chits.push(newChit);
    saveChits(chits);
    return newChit;
  },

  async addMember(chitId: string, payload: AddMemberPayload): Promise<Member> {
    // TODO: Replace with actual API call
    const chits = getStoredChits();
    const chit = chits.find(c => c.id === chitId);
    if (!chit) throw new Error('Chit not found');
    
    if (chit.members.length >= chit.totalMembers) {
      throw new Error('Maximum members reached');
    }

    const newMember: Member = {
      id: generateId(),
      ...payload,
      hasWon: false
    };

    chit.members.push(newMember);
    
    // Auto-activate when all members join
    if (chit.members.length === chit.totalMembers) {
      chit.status = 'active';
      chit.currentMonth = 1;
    }

    saveChits(chits);
    return newMember;
  },

  async removeMember(chitId: string, memberId: string): Promise<void> {
    const chits = getStoredChits();
    const chit = chits.find(c => c.id === chitId);
    if (!chit) throw new Error('Chit not found');
    if (chit.status !== 'draft') throw new Error('Cannot remove members from active chit');
    if (memberId === chit.organizerId) throw new Error('Cannot remove organizer');

    chit.members = chit.members.filter(m => m.id !== memberId);
    saveChits(chits);
  },

  async conductDraw(chitId: string): Promise<DrawResult> {
    // TODO: Replace with actual API call - random selection should happen on backend
    const chits = getStoredChits();
    const chit = chits.find(c => c.id === chitId);
    if (!chit) throw new Error('Chit not found');
    if (chit.status !== 'active') throw new Error('Chit is not active');
    if (chit.currentMonth > chit.durationMonths) throw new Error('All draws completed');

    // Get eligible members (not yet won)
    let eligibleMembers = chit.members.filter(m => !m.hasWon);
    
    // Handle organizer win rules
    const organizer = chit.members.find(m => m.id === chit.organizerId)!;
    const isFirstMonth = chit.currentMonth === 1;
    const isLastMonth = chit.currentMonth === chit.durationMonths;
    
    let winner: Member;

    if (chit.organizerWinsFirst && isFirstMonth && !organizer.hasWon) {
      // Organizer must win first month
      winner = organizer;
    } else if (!chit.organizerWinsFirst && isLastMonth && !organizer.hasWon) {
      // Organizer must win last month
      winner = organizer;
    } else if (!chit.organizerWinsFirst && eligibleMembers.length === 1) {
      // Only organizer left (for last month rule)
      winner = eligibleMembers[0];
    } else {
      // Random selection from eligible (excluding organizer if they must win last)
      if (!chit.organizerWinsFirst && !organizer.hasWon) {
        eligibleMembers = eligibleMembers.filter(m => m.id !== chit.organizerId);
      }
      const randomIndex = Math.floor(Math.random() * eligibleMembers.length);
      winner = eligibleMembers[randomIndex];
    }

    // Update winner status
    const memberIndex = chit.members.findIndex(m => m.id === winner.id);
    chit.members[memberIndex].hasWon = true;
    chit.members[memberIndex].wonInMonth = chit.currentMonth;

    // Create draw result
    const drawResult: DrawResult = {
      id: generateId(),
      month: chit.currentMonth,
      winnerId: winner.id,
      winnerName: winner.name,
      drawnAt: new Date().toISOString()
    };

    chit.draws.push(drawResult);
    chit.currentMonth++;

    // Mark as completed if all draws done
    if (chit.currentMonth > chit.durationMonths) {
      chit.status = 'completed';
    }

    saveChits(chits);
    return drawResult;
  },

  async getEligibleMembers(chitId: string): Promise<Member[]> {
    const chit = await this.getChit(chitId);
    if (!chit) return [];
    
    let eligible = chit.members.filter(m => !m.hasWon);
    
    // If organizer must win last, exclude them from random draw until last month
    if (!chit.organizerWinsFirst && chit.currentMonth < chit.durationMonths) {
      eligible = eligible.filter(m => m.id !== chit.organizerId);
    }
    
    return eligible;
  }
};
