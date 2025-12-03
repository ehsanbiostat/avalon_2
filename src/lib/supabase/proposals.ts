/**
 * Team Proposals database queries
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  TeamProposal,
  TeamProposalInsert,
  ProposalStatus,
} from '@/types/game';

/**
 * Create a new team proposal
 */
export async function createProposal(
  client: SupabaseClient,
  proposal: TeamProposalInsert
): Promise<TeamProposal> {
  const { data, error } = await client
    .from('team_proposals')
    .insert(proposal)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as TeamProposal;
}

/**
 * Get current pending proposal for a game
 */
export async function getCurrentProposal(
  client: SupabaseClient,
  gameId: string
): Promise<TeamProposal | null> {
  const { data, error } = await client
    .from('team_proposals')
    .select('*')
    .eq('game_id', gameId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as TeamProposal | null;
}

/**
 * Get proposal by ID
 */
export async function getProposalById(
  client: SupabaseClient,
  proposalId: string
): Promise<TeamProposal | null> {
  const { data, error } = await client
    .from('team_proposals')
    .select('*')
    .eq('id', proposalId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data as TeamProposal | null;
}

/**
 * Resolve a proposal (approved/rejected)
 */
export async function resolveProposal(
  client: SupabaseClient,
  proposalId: string,
  status: ProposalStatus,
  approveCount: number,
  rejectCount: number
): Promise<TeamProposal> {
  const { data, error } = await client
    .from('team_proposals')
    .update({
      status,
      approve_count: approveCount,
      reject_count: rejectCount,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', proposalId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as TeamProposal;
}

/**
 * Get all proposals for a quest
 */
export async function getProposalsForQuest(
  client: SupabaseClient,
  gameId: string,
  questNumber: number
): Promise<TeamProposal[]> {
  const { data, error } = await client
    .from('team_proposals')
    .select('*')
    .eq('game_id', gameId)
    .eq('quest_number', questNumber)
    .order('proposal_number', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as TeamProposal[];
}

/**
 * Get all proposals for a game
 */
export async function getAllProposals(
  client: SupabaseClient,
  gameId: string
): Promise<TeamProposal[]> {
  const { data, error } = await client
    .from('team_proposals')
    .select('*')
    .eq('game_id', gameId)
    .order('quest_number', { ascending: true })
    .order('proposal_number', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []) as TeamProposal[];
}

/**
 * Count proposals for current quest (to track vote track position)
 */
export async function countProposalsForQuest(
  client: SupabaseClient,
  gameId: string,
  questNumber: number
): Promise<number> {
  const { count, error } = await client
    .from('team_proposals')
    .select('*', { count: 'exact', head: true })
    .eq('game_id', gameId)
    .eq('quest_number', questNumber);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

