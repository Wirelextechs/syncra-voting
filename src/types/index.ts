export type ElectionStatus = 'draft' | 'open' | 'closed';

export interface Election {
  id: string;
  title: string;
  institution: string;
  status: ElectionStatus;
  start_time?: string;
  end_time?: string;
  created_at: string;
}

export interface Category {
  id: string;
  election_id: string;
  name: string;
}

export interface Candidate {
  id: string;
  category_id: string;
  name: string;
  photo_url?: string;
  votes_count: number;
}

export interface Voter {
  id: string;
  election_id: string;
  identifier: string;
  name: string;
  phone?: string;
  class?: string;
  otp?: string;
  otp_sent: boolean;
  voted: boolean;
}
